import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import PageShell from '../components/ui/PageShell.jsx'
import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <PageShell
      title="Page Not Found"
      description="The requested page or resource could not be found."
    >
      <div className="py-4 space-y-4">
        <p className="text-ink-secondary">
          The link you followed may be incorrect, or the resource may have been deleted.
        </p>
        <Link to="/" className="inline-block">
          <Button variant="primary" leftIcon={Home}>
            Back to Home
          </Button>
        </Link>
      </div>
    </PageShell>
  )
}
