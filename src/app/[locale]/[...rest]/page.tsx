import { notFound } from 'next/navigation'

/** Unknown paths inside a language render that language's 404 page (with header and footer). */
export default function CatchAll() {
  notFound()
}
