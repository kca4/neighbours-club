/**
 * Dev-only seed: insert 5 APPROVED ProcessedNotes for testing the
 * verified-read diminishing-curve faucet (checklist §6).
 *
 * Together with the existing test-note.ts note these give 6 total APPROVED
 * notes — enough to walk the full 5-read paid curve plus the 0-CP 6th read.
 *
 * Idempotent — upsert on slug, safe to re-run.
 * Run: npm run seed:test-notes-faucet
 */
import { PrismaClient, NoteCategory, NoteSourceType, NoteStatus } from '@prisma/client'

const prisma = new PrismaClient()

const NOTES = [
  {
    slug:      'test-kanata-eagleson-bus-frequency-dev',
    headline:  'OC Transpo increases Route 61 frequency on Eagleson Road',
    summary:
      'OC Transpo has added two additional trips on Route 61 during weekday ' +
      'morning and evening peak hours, reducing headways from 20 minutes to ' +
      '12 minutes along Eagleson Road between Kanata Centrum and Baseline ' +
      'Transitway Station. The change takes effect on the next schedule ' +
      'change date and is intended to address overcrowding flagged in rider ' +
      'feedback collected over the past quarter.',
    streetOrArea:    'Eagleson Road, Kanata',
    category:        NoteCategory.Transit,
    sourcePublisher: 'OC Transpo',
    impactSafety:    1,
    impactCost:      1,
    impactTime:      3,
    riskScore:       2,
  },
  {
    slug:      'test-kanata-fairwinds-community-cleanup-dev',
    headline:  'Fairwinds residents organise spring trail cleanup weekend',
    summary:
      'Volunteers from the Fairwinds neighbourhood are hosting a community ' +
      'trail cleanup on the Watts Creek pathway this Saturday from 9 am to ' +
      '1 pm. Organisers are asking participants to bring work gloves and ' +
      'sturdy footwear; bags and grabbers will be provided. Last year\'s ' +
      'event collected over 40 bags of debris from the trail corridor.',
    streetOrArea:    'Watts Creek Pathway, Kanata',
    category:        NoteCategory.Social,
    sourcePublisher: 'Kanata Community Association',
    impactSafety:    1,
    impactCost:      1,
    impactTime:      1,
    riskScore:       2,
  },
  {
    slug:      'test-kanata-marchwest-road-repaving-dev',
    headline:  'March Road repaving scheduled between Klondike and Beaver Pond',
    summary:
      'The City of Ottawa has scheduled full-depth asphalt repaving on March ' +
      'Road between Klondike Road and Beaver Pond Drive. Work begins Monday ' +
      'and is expected to last three weeks. Lanes will be alternated under ' +
      'traffic-control during daytime hours; overnight lane closures may ' +
      'occur on Thursdays and Fridays. Local access to driveways is ' +
      'maintained throughout. Residents on affected streets should move ' +
      'vehicles by 6 am on work days.',
    streetOrArea:    'March Road, Kanata',
    category:        NoteCategory.Transit,
    sourcePublisher: 'City of Ottawa Roads',
    impactSafety:    1,
    impactCost:      1,
    impactTime:      2,
    riskScore:       2,
  },
  {
    slug:      'test-kanata-bridlewood-community-garden-dev',
    headline:  'Bridlewood community garden opens new plot applications',
    summary:
      'The Bridlewood Community Garden is accepting applications for the ' +
      'upcoming growing season. Twenty-four plots are available, ranging ' +
      'from 4×8 ft raised beds to 10×20 ft in-ground plots. Annual fees ' +
      'are $40 for raised beds and $65 for in-ground plots, with a reduced ' +
      'rate available for seniors and students. Applications are first-come ' +
      'first-served and can be submitted through the recreation centre front ' +
      'desk or by email. Last year all plots filled within two weeks of opening.',
    streetOrArea:    'Bridlewood Drive, Kanata',
    category:        NoteCategory.Social,
    sourcePublisher: 'Bridlewood Community Association',
    impactSafety:    1,
    impactCost:      2,
    impactTime:      1,
    riskScore:       2,
  },
  {
    slug:      'test-kanata-hazeldean-sidewalk-repair-dev',
    headline:  'Hazeldean Road sidewalk panels replaced near Castlefrank',
    summary:
      'Several heaved and cracked concrete sidewalk panels on Hazeldean Road ' +
      'between Castlefrank Road and Teron Road have been replaced by the City ' +
      'of Ottawa as part of its annual accessibility maintenance program. The ' +
      'panels were flagged by residents and confirmed as tripping hazards in ' +
      'a ward-office inspection last autumn. Work was completed without ' +
      'significant traffic disruption.',
    streetOrArea:    'Hazeldean Road, Kanata',
    category:        NoteCategory.Transit,
    sourcePublisher: 'City of Ottawa',
    impactSafety:    2,
    impactCost:      1,
    impactTime:      1,
    riskScore:       2,
  },
]

async function main() {
  console.log('Seeding 5 faucet-QA test notes…\n')

  for (const n of NOTES) {
    const note = await prisma.processedNote.upsert({
      where: { slug: n.slug },
      update: {},  // re-running is a no-op — update nothing
      create: {
        slug:                n.slug,
        headline:            n.headline,
        summary:             n.summary,
        streetOrArea:        n.streetOrArea,
        category:            n.category,
        sourceType:          NoteSourceType.EDITORIAL,
        sourcePublisher:     n.sourcePublisher,
        impactSafety:        n.impactSafety,
        impactCost:          n.impactCost,
        impactTime:          n.impactTime,
        riskScore:           n.riskScore,
        autoPublishEligible: true,
        status:              NoteStatus.APPROVED,
        sourceUrl:           null,
      },
    })

    console.log(`✓ ${note.slug}`)
    console.log(`  id: ${note.id}`)
    console.log(`  headline: ${note.headline}`)
    console.log(`  /notes/${note.slug}\n`)
  }

  console.log('Done. 5 notes upserted.')
  console.log()
  console.log('With the existing test-kanata-terry-fox-road-closure-dev note,')
  console.log('you now have 6 total APPROVED notes — enough for the full faucet')
  console.log('curve (5 paid reads + 1 zero-CP 6th read).')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
