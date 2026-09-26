export const notImplemented = (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' })
}
