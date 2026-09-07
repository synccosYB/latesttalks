import { db } from "./db";
import { 
  teamMembers, 
  guestPipeline, 
  sponsors, 
  sponsorDeals,
  expenses,
  projects,
  monthlyFinancials 
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Team Members Data from Excel (22+ members)
const teamMembersData = [
  { name: "Pinchus Raab", email: "pinchus@latesttalks.com", phone: "", role: "Host", status: "active" },
  { name: "Ari Gordon", email: "", phone: "646-642-0030", role: "Manager", status: "active" },
  { name: "Yitzchok Berkowitz", email: "", phone: "718-840-5406", role: "Sound Engineer", status: "active" },
  { name: "Nochum Meisels", email: "", phone: "347-521-8015", role: "Audio Editor", status: "active" },
  { name: "Motty Guttman", email: "", phone: "732-444-0188", role: "Audio Editor", status: "active" },
  { name: "Yossi Mayer", email: "", phone: "347-986-7196", role: "Sound Engineer", status: "active" },
  { name: "Naftoli Greenberg", email: "naftoli@latesttalks.com", phone: "845-709-5568", role: "Video Editor", status: "active" },
  { name: "Yanky Hoffman", email: "", phone: "732-637-7106", role: "Audio Editor", status: "active" },
  { name: "Sender Rosenberg", email: "senderR@acd.org", phone: "347-318-4414", role: "Shorts Editor", status: "active" },
  { name: "Yanky Denburg", email: "", phone: "845-659-5168", role: "Graphics Designer", status: "active" },
  { name: "Yossi Hertz", email: "", phone: "646-709-4800", role: "Video Editor", status: "active" },
  { name: "Moishe Frankel", email: "", phone: "", role: "Guest Host", status: "active" },
  { name: "Berel Junik", email: "", phone: "", role: "Guest Host", status: "active" },
  { name: "Betzalel", email: "betzalel@latesttalks.com", phone: "", role: "Guest Host", status: "active" },
  { name: "Shaya Klyne", email: "", phone: "", role: "Guest Host", status: "active" },
  { name: "Shmuel Fischler", email: "", phone: "", role: "Audio Engineer", status: "active" },
  { name: "Levi Jeger", email: "", phone: "347-986-7196", role: "Guest Host", status: "active" },
  { name: "Dovy Maryles", email: "", phone: "", role: "Guest", status: "active" },
  { name: "Yaakov Shneck", email: "", phone: "", role: "Guest", status: "active" },
  { name: "Eli Steinberg", email: "", phone: "", role: "Guest", status: "active" },
  { name: "Dov Greenspan", email: "", phone: "", role: "Guest", status: "active" },
  { name: "Ari Spielman", email: "", phone: "", role: "Guest", status: "active" },
];

// Guest Pipeline Data from Excel (28+ prospects)
const guestPipelineData = [
  { name: "Heshy Tischler", description: "Famous NYC Political Figure", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Mori Reif", description: "Reb Shloime's son", recommendedBy: "", contactMethod: "phone", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Eli Rowe", description: "Iconic photographer", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Boruch Sorotzkin", description: "Telz Chicago / KLAL", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Binyamin Rechnitz", description: "Renowned philanthropist", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Yaakov Rosenthal", description: "Artscroll", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Nochum Rosenberg", description: "Paysach Krohn's grandson", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Chaskel Bennett", description: "Agudath Israel", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Shloime Dachs", description: "Famous Singer", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Rabbi Abba Zvi Naiman", description: "STAR-K Director", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Mordechai Lightstone", description: "Jewish Tech Leader", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Rabbi Eli Gersten", description: "OU Posek", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Yisroel Besser", description: "Mishpacha Magazine", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Yosef Chaim Golding", description: "Bonei Olam Exec", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Yehuda Leib Steiner", description: "Photographer", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Avrohom Newhouse", description: "Mishpacha Writer", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Yaakov Sherman", description: "JEP Director", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Shimmy Friedman", description: "Aish", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Yanky Meyer", description: "Misaskim", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Zevi Slavin", description: "NJ Rabbi", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Peretz Eichler", description: "Political Commentator", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Moshe Hill", description: "Political Commentator", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Ari Lamm", description: "Rabbi / Podcaster", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Binyomin Beser", description: "Director of JCF", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
  { name: "Rabbi Moshe Weinberger", description: "Aish Kodesh Rebbe", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Shloime Gertner", description: "Singer", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Yoel Gold", description: "Storyteller / Speaker", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "high" },
  { name: "Mendy Hecht", description: "Chabad.org Tech", recommendedBy: "", contactMethod: "", contactInfo: "", status: "prospect", priority: "medium" },
];

// Sponsor Deals Data by Year from Excel
const sponsorDealsData = [
  // 2021 - $10,300 total
  { sponsorName: "JellTel", amount: 3000, commission: 0, year: 2021, status: "paid" },
  { sponsorName: "Naomi Home", amount: 1000, commission: 0, year: 2021, status: "paid" },
  { sponsorName: "JellTel", amount: 2000, commission: 0, year: 2021, status: "paid" },
  { sponsorName: "Hatzolah Auction", amount: 1000, commission: 0, year: 2021, status: "paid" },
  { sponsorName: "Lakewood Shopper", amount: 600, commission: 0, year: 2021, status: "paid" },
  { sponsorName: "Tzimech", amount: 2500, commission: 500, year: 2021, status: "paid" },
  { sponsorName: "Lakewood Digital", amount: 200, commission: 0, year: 2021, status: "paid" },
  // 2022 - $13,600 total
  { sponsorName: "JellTel", amount: 1500, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Hatzolah Auction", amount: 500, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Jewish Discovery", amount: 1000, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "FrumLifestyle", amount: 1000, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Chofetz Chaim Heritage", amount: 750, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "JMM / Keren", amount: 500, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Kinus", amount: 2000, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Tzach (Chanuka)", amount: 2000, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Menucha/Feldheim", amount: 350, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Chaim V'Chessed", amount: 1000, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Shabbos Goy", amount: 1500, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "GYE", amount: 1000, commission: 0, year: 2022, status: "paid" },
  { sponsorName: "Misaskim", amount: 500, commission: 0, year: 2022, status: "paid" },
  // 2023 - $33,850 total
  { sponsorName: "Auctions", amount: 3000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Bonei Olam", amount: 2000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Kinus", amount: 3000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Fieldwork", amount: 2000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Appliance Choice", amount: 2000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Mesoras Moshe", amount: 3000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "JellTel", amount: 2000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "MusicOnTime", amount: 3000, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Living Smarter Jewish", amount: 7500, commission: 1500, year: 2023, status: "paid" },
  { sponsorName: "CardRight", amount: 1500, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Chanuka Expo", amount: 2500, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Chaim V'Chessed", amount: 600, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Rav Yisroel Kaplan Legacy", amount: 500, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Sholom", amount: 500, commission: 0, year: 2023, status: "paid" },
  { sponsorName: "Kol Haolam", amount: 750, commission: 0, year: 2023, status: "paid" },
  // 2024 - $73,700 total (largest year)
  { sponsorName: "CardRight", amount: 15000, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "JellTel", amount: 6500, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Auctions", amount: 5000, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "The Alter Family", amount: 3600, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Appliance Choice", amount: 2500, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Bonei Olam", amount: 2500, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Chanuka Expo", amount: 3500, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "United Refuah", amount: 5000, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Hiring4Less", amount: 3000, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Luxury Kosher Villas", amount: 5000, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Dirshu", amount: 5000, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Kol Haolam", amount: 4500, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "MusicOnTime", amount: 4000, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "DAF Yomi", amount: 3500, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "Kinus", amount: 2500, commission: 0, year: 2024, status: "paid" },
  { sponsorName: "WhiteHouse", amount: 2600, commission: 0, year: 2024, status: "paid" },
  // 2025 - $30,500 (ongoing)
  { sponsorName: "CardRight", amount: 7500, commission: 0, year: 2025, status: "paid" },
  { sponsorName: "JellTel", amount: 3000, commission: 0, year: 2025, status: "paid" },
  { sponsorName: "United Refuah", amount: 5000, commission: 0, year: 2025, status: "paid" },
  { sponsorName: "Hiring4Less", amount: 3000, commission: 0, year: 2025, status: "paid" },
  { sponsorName: "Appliance Choice", amount: 2500, commission: 0, year: 2025, status: "paid" },
  { sponsorName: "Kol Haolam", amount: 3000, commission: 0, year: 2025, status: "paid" },
  { sponsorName: "MusicOnTime", amount: 3500, commission: 0, year: 2025, status: "paid" },
  { sponsorName: "Luxury Kosher Villas", amount: 3000, commission: 0, year: 2025, status: "paid" },
];

// Equipment Expenses Data from Excel - $44,721 total
const equipmentExpensesData = [
  { category: "equipment", description: "Sony FX3 Camera", amount: 4500, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Canon C70 Camera", amount: 5500, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Atomos Ninja V Monitor", amount: 700, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "DJI Ronin RS3 Pro Gimbal", amount: 800, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "Rode Wireless GO II", amount: 300, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Shure SM7B Microphone", amount: 400, vendor: "Sweetwater", year: 2023 },
  { category: "equipment", description: "Electro-Voice RE20 Mic", amount: 450, vendor: "Sweetwater", year: 2023 },
  { category: "equipment", description: "Focusrite Scarlett 18i20", amount: 500, vendor: "Amazon", year: 2023 },
  { category: "equipment", description: "Aputure 600D Light", amount: 2000, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Aputure 300D II Light", amount: 1100, vendor: "B&H Photo", year: 2023 },
  { category: "equipment", description: "Godox SL200 II Lights (3)", amount: 750, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "SmallRig Cage Systems", amount: 500, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "Sigma 24-70mm f/2.8 Lens", amount: 1000, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Sony 50mm f/1.4 GM Lens", amount: 1300, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Canon RF 28-70mm f/2 Lens", amount: 3000, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Studio Monitor Speakers", amount: 600, vendor: "Sweetwater", year: 2023 },
  { category: "equipment", description: "Acoustic Panels Set", amount: 800, vendor: "Amazon", year: 2023 },
  { category: "equipment", description: "Stream Deck XL", amount: 250, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "Blackmagic ATEM Mini Pro", amount: 600, vendor: "B&H Photo", year: 2023 },
  { category: "equipment", description: "MacBook Pro 16\" M3 Max", amount: 3500, vendor: "Apple", year: 2024 },
  { category: "equipment", description: "Mac Studio M2 Ultra", amount: 4000, vendor: "Apple", year: 2024 },
  { category: "equipment", description: "LG 32\" 4K Monitors (2)", amount: 1200, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "Studio Desk Setup", amount: 1500, vendor: "IKEA", year: 2023 },
  { category: "equipment", description: "Cable Management & Accessories", amount: 400, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "Sony A7 IV Camera", amount: 2500, vendor: "B&H Photo", year: 2023 },
  { category: "equipment", description: "Teleprompter System", amount: 350, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "LED Panel Lights (4)", amount: 800, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "Microphone Boom Arms (4)", amount: 200, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "XLR Cables & Accessories", amount: 300, vendor: "Amazon", year: 2024 },
  { category: "equipment", description: "Memory Cards & Storage", amount: 500, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Tripods & Stands", amount: 600, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Backdrop System", amount: 400, vendor: "Amazon", year: 2023 },
  { category: "equipment", description: "Green Screen Setup", amount: 300, vendor: "Amazon", year: 2023 },
  { category: "equipment", description: "Adobe Creative Cloud (Annual)", amount: 660, vendor: "Adobe", year: 2024 },
  { category: "equipment", description: "DaVinci Resolve Studio", amount: 295, vendor: "Blackmagic", year: 2024 },
  { category: "equipment", description: "Hard Drives & NAS Storage", amount: 2000, vendor: "B&H Photo", year: 2024 },
  { category: "equipment", description: "Miscellaneous Equipment", amount: 921, vendor: "Various", year: 2024 },
];

// Monthly Operating Expenses template (~$17,500/month)
const monthlyOperatingExpensesData = [
  { category: "rent", description: "Studio Rent", amount: 2400, recurring: true },
  { category: "payroll", description: "Pinchus Raab (Host/Producer)", amount: 7200, recurring: true },
  { category: "payroll", description: "Editor Team", amount: 6400, recurring: true },
  { category: "software", description: "Software Subscriptions", amount: 343, recurring: true },
  { category: "food", description: "Guest Food & Refreshments", amount: 300, recurring: true },
  { category: "utilities", description: "Utilities & Internet", amount: 250, recurring: true },
  { category: "marketing", description: "Marketing & Promotion", amount: 500, recurring: true },
  { category: "miscellaneous", description: "Miscellaneous Expenses", amount: 107, recurring: true },
];

// Projects from Excel
const projectsData = [
  { name: "Tisha Bav Special", description: "Annual Tisha Bav programming", status: "completed", year: 2024 },
  { name: "Chanukah Special", description: "Chanukah themed episodes", status: "completed", year: 2024 },
  { name: "White House Visit", description: "Coverage of White House events", status: "completed", year: 2024 },
  { name: "Dirshu Partnership", description: "Dirshu sponsored content", status: "active", year: 2024 },
  { name: "DAF Yomi", description: "Daf Yomi related content", status: "active", year: 2024 },
  { name: "Jewish Communities Series", description: "Exploring Jewish communities worldwide", status: "active", year: 2025 },
];

async function seedOperations() {
  console.log("Starting operations data import...");

  // Seed Team Members
  const existingTeam = await db.select().from(teamMembers);
  if (existingTeam.length === 0) {
    console.log("Importing team members...");
    for (const member of teamMembersData) {
      await db.insert(teamMembers).values(member);
    }
    console.log(`✓ Imported ${teamMembersData.length} team members`);
  } else {
    console.log(`Team members already exist (${existingTeam.length} found)`);
  }

  // Seed Guest Pipeline
  const existingPipeline = await db.select().from(guestPipeline);
  if (existingPipeline.length === 0) {
    console.log("Importing guest pipeline...");
    for (const prospect of guestPipelineData) {
      await db.insert(guestPipeline).values(prospect);
    }
    console.log(`✓ Imported ${guestPipelineData.length} guest prospects`);
  } else {
    console.log(`Guest pipeline already exists (${existingPipeline.length} found)`);
  }

  // Create sponsors from deals (unique sponsor names)
  const existingSponsors = await db.select().from(sponsors);
  const existingSponsorNames = new Set(existingSponsors.map(s => s.name.toLowerCase()));
  const uniqueSponsorNames = [...new Set(sponsorDealsData.map(d => d.sponsorName))];
  
  let newSponsorsCount = 0;
  for (const sponsorName of uniqueSponsorNames) {
    if (!existingSponsorNames.has(sponsorName.toLowerCase())) {
      await db.insert(sponsors).values({
        name: sponsorName,
        contractStatus: "active",
      });
      newSponsorsCount++;
    }
  }
  if (newSponsorsCount > 0) {
    console.log(`✓ Created ${newSponsorsCount} new sponsors`);
  }

  // Seed Sponsor Deals
  const existingDeals = await db.select().from(sponsorDeals);
  if (existingDeals.length === 0) {
    console.log("Importing sponsor deals...");
    const allSponsors = await db.select().from(sponsors);
    const sponsorMap = new Map(allSponsors.map(s => [s.name.toLowerCase(), s.id]));
    
    for (const deal of sponsorDealsData) {
      const sponsorId = sponsorMap.get(deal.sponsorName.toLowerCase());
      if (sponsorId) {
        await db.insert(sponsorDeals).values({
          sponsorId: sponsorId,
          dealName: `${deal.sponsorName} - ${deal.year}`,
          amount: deal.amount,
          commissionAmount: deal.commission,
          status: deal.status,
          startDate: new Date(`${deal.year}-01-01`),
          endDate: new Date(`${deal.year}-12-31`),
          notes: `Imported from Excel - ${deal.year}`,
        });
      }
    }
    console.log(`✓ Imported ${sponsorDealsData.length} sponsor deals`);
  } else {
    console.log(`Sponsor deals already exist (${existingDeals.length} found)`);
  }

  // Seed Equipment Expenses
  const existingExpenses = await db.select().from(expenses);
  const equipmentExpenses = existingExpenses.filter(e => e.category === "equipment");
  if (equipmentExpenses.length === 0) {
    console.log("Importing equipment expenses...");
    for (const expense of equipmentExpensesData) {
      await db.insert(expenses).values({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        vendor: expense.vendor,
        recurring: false,
        incurredDate: new Date(`${expense.year}-06-15`), // Mid-year date for equipment
        paid: true,
        notes: `Equipment purchase - ${expense.year}`,
      });
    }
    console.log(`✓ Imported ${equipmentExpensesData.length} equipment expenses`);
  } else {
    console.log(`Equipment expenses already exist (${equipmentExpenses.length} found)`);
  }

  // Seed Projects
  const existingProjects = await db.select().from(projects);
  if (existingProjects.length === 0) {
    console.log("Importing projects...");
    for (const project of projectsData) {
      await db.insert(projects).values({
        name: project.name,
        description: project.description,
        status: project.status,
        notes: `Year: ${project.year}`,
      });
    }
    console.log(`✓ Imported ${projectsData.length} projects`);
  } else {
    console.log(`Projects already exist (${existingProjects.length} found)`);
  }

  // Seed Monthly Financials for 2024 and 2025
  const existingFinancials = await db.select().from(monthlyFinancials);
  if (existingFinancials.length === 0) {
    console.log("Importing monthly financial data...");
    
    // Calculate totals based on monthly operating expenses
    const monthlyOperatingTotal = monthlyOperatingExpensesData.reduce((sum, e) => sum + e.amount, 0);
    
    // 2024 monthly data (12 months)
    for (let month = 1; month <= 12; month++) {
      // Get deals for this month (distribute across year)
      const yearDeals = sponsorDealsData.filter(d => d.year === 2024);
      const monthlyAdIncome = Math.round(yearDeals.reduce((sum, d) => sum + d.amount, 0) / 12);
      
      const totalIncome = monthlyAdIncome;
      const payrollExpenses = 6400 + 7200; // Editors + Pinchus
      const billsExpenses = 2400 + 250; // Rent + Utilities
      const softwareExpenses = 343;
      const otherExp = 300 + 107 + 500; // Food + Misc + Marketing
      const equipmentExp = month === 6 ? 10000 : 0;
      const totalExp = payrollExpenses + billsExpenses + softwareExpenses + otherExp + equipmentExp;
      
      await db.insert(monthlyFinancials).values({
        year: 2024,
        month,
        adIncome: monthlyAdIncome,
        sponsorIncome: 0,
        otherIncome: 0,
        totalIncome: totalIncome,
        payrollExpenses: payrollExpenses,
        billsExpenses: billsExpenses,
        softwareExpenses: softwareExpenses,
        otherExpenses: otherExp + equipmentExp,
        totalExpenses: totalExp,
        netProfit: totalIncome - totalExp,
        episodesReleased: 4, // Approximately 4 episodes per month
      });
    }
    
    // 2025 monthly data (Jan-Nov for ongoing year)
    for (let month = 1; month <= 11; month++) {
      const yearDeals = sponsorDealsData.filter(d => d.year === 2025);
      const monthlyAdIncome = Math.round(yearDeals.reduce((sum, d) => sum + d.amount, 0) / 11);
      
      const totalIncome = monthlyAdIncome;
      const payrollExpenses = 6400 + 7200;
      const billsExpenses = 2400 + 250;
      const softwareExpenses = 343;
      const otherExp = 300 + 107 + 500;
      const totalExp = payrollExpenses + billsExpenses + softwareExpenses + otherExp;
      
      await db.insert(monthlyFinancials).values({
        year: 2025,
        month,
        adIncome: monthlyAdIncome,
        sponsorIncome: 0,
        otherIncome: 0,
        totalIncome: totalIncome,
        payrollExpenses: payrollExpenses,
        billsExpenses: billsExpenses,
        softwareExpenses: softwareExpenses,
        otherExpenses: otherExp,
        totalExpenses: totalExp,
        netProfit: totalIncome - totalExp,
        episodesReleased: 4,
      });
    }
    
    console.log(`✓ Imported 23 months of financial data (2024-2025)`);
  } else {
    console.log(`Monthly financials already exist (${existingFinancials.length} found)`);
  }

  // Print summary
  console.log("\n========== IMPORT SUMMARY ==========");
  console.log(`Team Members: ${(await db.select().from(teamMembers)).length}`);
  console.log(`Guest Pipeline: ${(await db.select().from(guestPipeline)).length}`);
  console.log(`Sponsors: ${(await db.select().from(sponsors)).length}`);
  console.log(`Sponsor Deals: ${(await db.select().from(sponsorDeals)).length}`);
  console.log(`Expenses: ${(await db.select().from(expenses)).length}`);
  console.log(`Projects: ${(await db.select().from(projects)).length}`);
  console.log(`Monthly Financials: ${(await db.select().from(monthlyFinancials)).length}`);
  console.log("=====================================\n");

  console.log("Operations data import complete!");
}

seedOperations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
