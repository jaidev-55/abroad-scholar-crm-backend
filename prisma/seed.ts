import {
  PrismaClient,
  LeadStatus,
  LeadSource,
  LeadPriority,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.lead.createMany({
    data: [
      {
        fullName: "Aarav Mehta",
        phone: "9000000001",
        email: "aarav@mail.com",
        country: "UK",
        source: LeadSource.INSTAGRAM,
        priority: LeadPriority.HOT,
        status: LeadStatus.NEW,
      },
      {
        fullName: "Sneha Reddy",
        phone: "9000000002",
        email: "sneha@mail.com",
        country: "Canada",
        source: LeadSource.REFERRAL,
        priority: LeadPriority.WARM,
        status: LeadStatus.IN_PROGRESS,
      },
      {
        fullName: "Rahul Nair",
        phone: "9000000003",
        email: "rahul@mail.com",
        country: "Germany",
        source: LeadSource.WALK_IN,
        priority: LeadPriority.COLD,
        status: LeadStatus.CONVERTED,
      },
      {
        fullName: "Meera Iyer",
        phone: "9000000004",
        email: "meera@mail.com",
        country: "Ireland",
        source: LeadSource.GOOGLE_ADS,
        priority: LeadPriority.WARM,
        status: LeadStatus.LOST,
      },
    ],
  });

  console.log("Dummy leads inserted ");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
