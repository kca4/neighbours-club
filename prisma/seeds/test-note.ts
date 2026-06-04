/**
 * Dev-only seed: insert one APPROVED ProcessedNote for testing the
 * verify-read CP button.
 *
 * Idempotent — upsert on slug, safe to re-run.
 * Run: npm run seed:test-note
 */
import { PrismaClient, NoteCategory, NoteSourceType, NoteStatus } from '@prisma/client'

const prisma = new PrismaClient()

const SLUG = 'test-kanata-terry-fox-road-closure-dev'

async function main() {
  const note = await prisma.processedNote.upsert({
    where: { slug: SLUG },
    update: {}, // re-running is a no-op — update nothing
    create: {
      slug: SLUG,
      headline: 'Terry Fox Drive lane closure between Campeau and Goulbourn Forced Road',
      summary:
        'The City of Ottawa has scheduled a daytime lane closure on Terry Fox Drive ' +
        'between Campeau Drive and Goulbourn Forced Road for watermain maintenance. ' +
        'Expect single-lane alternating traffic controlled by flaggers from 7 am to ' +
        '5 pm on weekdays. Drivers are advised to allow extra travel time or use ' +
        'Eagleson Road as an alternate route. The work is expected to last two weeks.',
      streetOrArea: 'Terry Fox Drive, Kanata',
      category: NoteCategory.Transit,
      sourceType: NoteSourceType.EDITORIAL,
      impactSafety: 1,
      impactCost:   1,
      impactTime:   3,
      riskScore:    3,
      autoPublishEligible: true,
      status: NoteStatus.APPROVED,
      sourceUrl: null,
    },
  })

  console.log('✓ Test note upserted')
  console.log('  id:   ', note.id)
  console.log('  slug: ', note.slug)
  console.log('  status:', note.status)
  console.log()
  console.log(`Navigate to: /notes/${note.slug}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
