"""ISRIC SoilGrids v2.0 REST client (no API key) -- estimated global soil properties for a
latitude/longitude, for pre-filling the soil-health form, never for replacing it.

**Read `docs/soil-reference-proposal.md` before wiring this into anything.** Short version:
only `ph` and `organic_carbon` have any real correspondence to our fixed soil schema
(`n, p, k, ph, organic_carbon, moisture` -- AGENTS.md, never renamed). `n`/`p`/`k`/`moisture`
are always returned as `None` here, on purpose, not TODO -- see NOT_MAPPED below for why each
one genuinely can't be estimated from this source, not just "not implemented yet."

Verified live against https://rest.isric.org/soilgrids/v2.0/properties/query while building
this: **exact-coordinate queries over Ludhiana city center (our own demo region, e.g.
30.911,75.847) return null for every property**, while points 10-50km away return real values --
an apparent urban/built-up masking gap in SoilGrids' coverage, not a bug in this client. A field
near any town can plausibly hit this. Confirmed reproducible across three separate calls, not a
transient error.
"""

import json
import time
from hashlib import sha256
from pathlib import Path

import httpx

SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"

CACHE_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / "soil_reference_cache"

TIMEOUT_SECONDS = 5.0
MAX_RETRIES = 1  # one retry after the first attempt fails -- two attempts total

# ISRIC's stated fair-use policy (docs.isric.org SoilGrids FAQ, checked 2026-09-27): 5 API calls
# per minute. This client makes exactly one call per get_soil_estimate() invocation (multiple
# properties in one request), file-cached by (lat, lon) -- any caller doing more than ~4-5
# distinct field lookups per minute needs to queue/throttle itself, this module doesn't do it
# for you.
DEPTH = "0-5cm"  # topsoil, the shallowest band SoilGrids offers; see docs/soil-reference-proposal.md
PROPERTIES = ("phh2o", "soc")  # only the two we can honestly use -- see module docstring

# Each SoilGrids property is returned as a scaled integer; divide by d_factor to get the
# property's own "target_units" (ISRIC's own conversion table, confirmed live against the API's
# unit_measure field for these two properties -- not assumed).
_PHH2O_D_FACTOR = 10  # raw value / 10 = pH (raw is "pH*10")
_SOC_D_FACTOR = 10  # raw value / 10 = g/kg soil organic carbon (raw is "dg/kg")
_GRAMS_PER_KG_PER_PERCENT = 10  # 1% = 10 g/kg, by definition of percent-by-mass

# n/p/k/moisture are never estimated from SoilGrids -- see the module docstring and
# docs/soil-reference-proposal.md for why each one specifically can't be, not just "TODO".
NOT_MAPPED = {
    "n": (
        "SoilGrids' only nitrogen property is TOTAL soil nitrogen (g/kg, mostly locked in "
        "organic matter). Our schema's n is AVAILABLE nitrogen in kg/ha (Soil Health Card "
        "basis, alkaline-permanganate method) -- a different soil property, not a unit "
        "conversion of the same thing. No defensible mapping exists."
    ),
    "p": "SoilGrids has no phosphorus property of any kind (confirmed against ISRIC's own property list).",
    "k": "SoilGrids has no potassium property of any kind (confirmed against ISRIC's own property list).",
    "moisture": (
        "SoilGrids is a static, long-term-average map, not a live reading -- moisture is "
        "dynamic and already sourced live from Open-Meteo (src/weather/weather_client.py) "
        "elsewhere in this project. Not attempted here."
    ),
}


class SoilReferenceError(Exception):
    """A SoilGrids API call failed (network, timeout, or an unexpected response shape)."""


def _cache_path(lat: float, lon: float) -> Path:
    key = sha256(json.dumps({"lat": lat, "lon": lon, "properties": PROPERTIES, "depth": DEPTH}, sort_keys=True).encode()).hexdigest()
    return CACHE_DIR / f"{key}.json"


def _get(lat: float, lon: float, client: httpx.Client | None = None) -> dict:
    cache_path = _cache_path(lat, lon)
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    params = [("lat", lat), ("lon", lon), ("depth", DEPTH), ("value", "mean")]
    params += [("property", p) for p in PROPERTIES]

    owns_client = client is None
    client = client or httpx.Client(timeout=TIMEOUT_SECONDS)
    try:
        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = client.get(SOILGRIDS_URL, params=params)
                response.raise_for_status()
                data = response.json()
                break
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                if attempt < MAX_RETRIES:
                    time.sleep(0.5)
        else:
            raise SoilReferenceError(f"GET {SOILGRIDS_URL} failed after {MAX_RETRIES + 1} attempt(s): {last_error}") from last_error
    finally:
        if owns_client:
            client.close()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(data), encoding="utf-8")
    return data


def get_soil_estimate(lat: float, lon: float, client: httpx.Client | None = None) -> dict:
    """Best-effort estimated soil properties for a field's coordinates, from SoilGrids' 0-5cm
    topsoil layer.

    Returns:
        {
          "ph": float | None,                 # pH units, same scale as our schema's ph
          "organic_carbon_pct": float | None,  # percent, same scale as our schema's organic_carbon
          "n": None, "p": None, "k": None, "moisture": None,  # always None -- see NOT_MAPPED
          "source": "soilgrids_v2.0 (ISRIC), 0-5cm topsoil, CC-BY 4.0 -- https://rest.isric.org",
          "coverage": {"ph": bool, "organic_carbon_pct": bool},  # False when SoilGrids itself
              # returned null for this exact point (a real, observed gap over/near urban areas --
              # see module docstring), not a client-side failure.
        }

    Raises SoilReferenceError only for a genuine API/network failure -- a real point with no
    SoilGrids coverage is NOT an error, it's `coverage: {...: False}` with `ph`/`organic_carbon_pct`
    as None, exactly the same "degrade gracefully, never hard-fail" pattern as
    src/weather/weather_client.py. Callers must handle both None cases (no coverage) and a raised
    SoilReferenceError (API down) the same way: fall back to the farmer's own manual soil-test
    entry, never a guessed number.
    """
    try:
        data = _get(lat, lon, client=client)
        layers = {layer["name"]: layer for layer in data["properties"]["layers"]}
        phh2o_raw = layers["phh2o"]["depths"][0]["values"]["mean"]
        soc_raw = layers["soc"]["depths"][0]["values"]["mean"]
    except (KeyError, IndexError, TypeError) as exc:
        raise SoilReferenceError(f"unexpected SoilGrids response shape: {exc}") from exc

    ph = phh2o_raw / _PHH2O_D_FACTOR if phh2o_raw is not None else None
    organic_carbon_pct = (
        (soc_raw / _SOC_D_FACTOR) / _GRAMS_PER_KG_PER_PERCENT if soc_raw is not None else None
    )

    return {
        "ph": ph,
        "organic_carbon_pct": organic_carbon_pct,
        "n": None,
        "p": None,
        "k": None,
        "moisture": None,
        "source": "soilgrids_v2.0 (ISRIC), 0-5cm topsoil, CC-BY 4.0 -- https://rest.isric.org",
        "coverage": {"ph": ph is not None, "organic_carbon_pct": organic_carbon_pct is not None},
    }
