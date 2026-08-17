import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AMENITY_CATALOG } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.viewingRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.propertyView.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.report.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyMedia.deleteMany();
  await prisma.property.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.district.deleteMany();
  await prisma.region.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();

  const passwordHash = await bcrypt.hash("EstateHub@2026", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@estatehub.com",
      passwordHash,
      firstName: "Amina",
      lastName: "Mwamba",
      phone: "+255 754 000 001",
      role: "ADMIN",
      emailVerified: true,
      bio: "EstateHub platform administrator.",
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: "agent@estatehub.com",
      passwordHash,
      firstName: "Daniel",
      lastName: "Kileo",
      phone: "+255 754 000 010",
      role: "AGENT",
      emailVerified: true,
      agencyName: "Kileo & Partners Realty",
      licenseNumber: "BRELA-AG-2041",
      bio: "Luxury and residential specialist covering Dar es Salaam and the coast.",
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: "neema@estatehub.com",
      passwordHash,
      firstName: "Neema",
      lastName: "Shirima",
      phone: "+255 754 000 011",
      role: "AGENT",
      emailVerified: true,
      agencyName: "Northern Circuit Homes",
      licenseNumber: "BRELA-AG-1188",
      bio: "Arusha, Moshi and safari-corridor properties.",
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@estatehub.com",
      passwordHash,
      firstName: "Joseph",
      lastName: "Mushi",
      phone: "+255 754 000 020",
      role: "OWNER",
      emailVerified: true,
      bio: "Portfolio owner with residential and commercial assets in Dar and Dodoma.",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@estatehub.com",
      passwordHash,
      firstName: "Samya",
      lastName: "Hassan",
      phone: "+255 754 000 030",
      role: "CUSTOMER",
      emailVerified: true,
      bio: "Looking for a family home in Dar es Salaam.",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "lina@estatehub.com",
      passwordHash,
      firstName: "Lina",
      lastName: "Mwakyusa",
      phone: "+255 754 000 031",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  const amenities = await Promise.all(
    AMENITY_CATALOG.map((a) => prisma.amenity.create({ data: { name: a.name, icon: a.icon } })),
  );
  const amenity = (name: string) => amenities.find((a) => a.name === name)!.id;

  const categories = await Promise.all(
    ["Residential", "Commercial", "Land", "Hospitality", "Industrial", "Agricultural"].map((name) =>
      prisma.category.create({
        data: { name, slug: name.toLowerCase(), description: `${name} property listings` },
      }),
    ),
  );

  const dar = await prisma.region.create({ data: { name: "Dar es Salaam" } });
  const arusha = await prisma.region.create({ data: { name: "Arusha" } });
  const mwanza = await prisma.region.create({ data: { name: "Mwanza" } });
  const dodoma = await prisma.region.create({ data: { name: "Dodoma" } });
  const pwani = await prisma.region.create({ data: { name: "Pwani" } });
  const zanzibar = await prisma.region.create({ data: { name: "Zanzibar" } });

  const kinondoni = await prisma.district.create({ data: { name: "Kinondoni", regionId: dar.id } });
  const ilala = await prisma.district.create({ data: { name: "Ilala", regionId: dar.id } });
  const ubungo = await prisma.district.create({ data: { name: "Ubungo", regionId: dar.id } });
  const arushaCity = await prisma.district.create({ data: { name: "Arusha City", regionId: arusha.id } });
  const bagamoyo = await prisma.district.create({ data: { name: "Bagamoyo", regionId: pwani.id } });
  const mjini = await prisma.district.create({ data: { name: "Mjini Magharibi", regionId: zanzibar.id } });
  const nyamagana = await prisma.district.create({ data: { name: "Nyamagana", regionId: mwanza.id } });
  const dodomaCity = await prisma.district.create({ data: { name: "Dodoma City", regionId: dodoma.id } });

  const masaki = await prisma.ward.create({ data: { name: "Masaki", districtId: kinondoni.id } });
  const mikocheni = await prisma.ward.create({ data: { name: "Mikocheni", districtId: kinondoni.id } });
  const mbezi = await prisma.ward.create({ data: { name: "Mbezi", districtId: kinondoni.id } });
  const mwenge = await prisma.ward.create({ data: { name: "Mwenge", districtId: kinondoni.id } });
  const sinza = await prisma.ward.create({ data: { name: "Sinza", districtId: kinondoni.id } });
  const makongo = await prisma.ward.create({ data: { name: "Makongo", districtId: kinondoni.id } });
  const karia = await prisma.ward.create({ data: { name: "Kariakoo", districtId: ilala.id } });
  const cbd = await prisma.ward.create({ data: { name: "Upanga", districtId: ilala.id } });
  const dunda = await prisma.ward.create({ data: { name: "Dunda", districtId: bagamoyo.id } });
  const shangani = await prisma.ward.create({ data: { name: "Shangani", districtId: mjini.id } });
  const tengeru = await prisma.ward.create({ data: { name: "Tengeru", districtId: arushaCity.id } });
  const nzuguni = await prisma.ward.create({ data: { name: "Nzuguni", districtId: dodomaCity.id } });
  const mirongo = await prisma.ward.create({ data: { name: "Mirongo", districtId: nyamagana.id } });
  const sokoine = await prisma.ward.create({ data: { name: "Sombetini", districtId: arushaCity.id } });

  const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

  const listings = [
    {
      title: "Ocean-facing villa in Masaki",
      description:
        "A six-bedroom contemporary villa on the Msasani Peninsula with a private pool, staff quarters, and uninterrupted Indian Ocean views. Ideal for diplomats and executives who want security, space, and a short drive to the CBD.",
      propertyType: "VILLA",
      listingType: "FOR_SALE",
      price: 1_850_000_000,
      address: "Toure Drive, Masaki",
      region: dar,
      district: kinondoni,
      ward: masaki,
      lat: -6.746,
      lng: 39.279,
      bedrooms: 6,
      bathrooms: 7,
      parking: 4,
      size: 720,
      land: 1800,
      year: 2019,
      furnished: "FURNISHED",
      listedById: agent.id,
      ownerId: owner.id,
      categoryId: categories[0].id,
      images: ["1600596542815-ffad4c1539a9", "1600607687939-ce8a6c25118c", "1600585154340-be6161a56a0c"],
      amenityNames: ["Swimming Pool", "Garden", "Security", "Generator", "Sea View", "CCTV", "Servant Quarter"],
      views: 428,
      favorites: 36,
    },
    {
      title: "3-bedroom apartment in Mikocheni",
      description:
        "Bright apartment in a gated compound with backup power, borehole water, and assigned parking. Walking distance to international schools and cafes.",
      propertyType: "APARTMENT",
      listingType: "FOR_RENT",
      price: 1_800_000,
      address: "Old Bagamoyo Road, Mikocheni B",
      region: dar,
      district: kinondoni,
      ward: mikocheni,
      lat: -6.765,
      lng: 39.25,
      bedrooms: 3,
      bathrooms: 2,
      parking: 2,
      size: 145,
      land: 0,
      year: 2016,
      furnished: "SEMI_FURNISHED",
      listedById: agent.id,
      ownerId: owner.id,
      categoryId: categories[0].id,
      images: ["1502672260266-1c1ef2d93688", "1560448204-e02f11e3e2cc", "1493809842364-78817add7ffb"],
      amenityNames: ["Security", "Parking", "Internet", "Water Tank", "Backup Power"],
      views: 612,
      favorites: 54,
    },
    {
      title: "Kunduchi beach house for short stays",
      description:
        "Four-bedroom holiday home steps from the beach, with an open living pavilion, outdoor kitchen, and space for 10 guests. Perfect for weekends and corporate retreats.",
      propertyType: "HOUSE",
      listingType: "SHORT_TERM_RENTAL",
      price: 350_000,
      address: "Kunduchi Beach, Kinondoni",
      region: dar,
      district: kinondoni,
      ward: mbezi,
      lat: -6.668,
      lng: 39.208,
      bedrooms: 4,
      bathrooms: 4,
      parking: 3,
      size: 280,
      land: 900,
      year: 2018,
      furnished: "FURNISHED",
      listedById: agent.id,
      categoryId: categories[3].id,
      images: ["1564013799919-ab600027ffc6", "1505693416388-ac5ce068fe85", "1600210492486-724fe5c67fb0"],
      amenityNames: ["Swimming Pool", "Sea View", "Garden", "Air Conditioning", "Pet Friendly"],
      views: 390,
      favorites: 41,
    },
    {
      title: "Grade-A office floors in Upanga",
      description:
        "Two contiguous floors in a modern CBD tower with fibre, backup power, and 12 reserved parking bays. Available on a 5-year lease.",
      propertyType: "OFFICE",
      listingType: "LEASE",
      price: 42_000_000,
      address: "Ohio Street, Upanga",
      region: dar,
      district: ilala,
      ward: cbd,
      lat: -6.81,
      lng: 39.28,
      bedrooms: 0,
      bathrooms: 6,
      parking: 12,
      size: 980,
      land: 0,
      year: 2021,
      furnished: "UNFURNISHED",
      listedById: agent.id,
      ownerId: owner.id,
      categoryId: categories[1].id,
      images: ["1486406146926-c627a92ad1ab", "1497366216548-37526070297c", "1524758631624-e4d2207d6c0c"],
      amenityNames: ["Elevator", "Security", "Parking", "Internet", "Generator", "CCTV"],
      views: 211,
      favorites: 12,
    },
    {
      title: "Retail shop on Kariakoo frontage",
      description:
        "High-footfall lock-up shop facing Msimbazi Street. Mezzanine storage, steel shutters, and three-phase power.",
      propertyType: "SHOP",
      listingType: "FOR_RENT",
      price: 2_400_000,
      address: "Msimbazi Street, Kariakoo",
      region: dar,
      district: ilala,
      ward: karia,
      lat: -6.822,
      lng: 39.275,
      bedrooms: 0,
      bathrooms: 1,
      parking: 0,
      size: 62,
      land: 0,
      year: 2008,
      furnished: "UNFURNISHED",
      listedById: owner.id,
      ownerId: owner.id,
      categoryId: categories[1].id,
      images: ["1441986300917-64674bd600d8", "1441984904996-e0b6ba7a6f2c", "1472851298518-b7d4161b4c7d"],
      amenityNames: ["Security", "Backup Power"],
      views: 174,
      favorites: 9,
    },
    {
      title: "Titled residential land in Bagamoyo",
      description:
        "1.2 acres of surveyed land with title deed, 400m from the tarmac, suitable for a villa compound or small lodge. Electricity at the boundary.",
      propertyType: "LAND",
      listingType: "FOR_SALE",
      price: 95_000_000,
      address: "Dunda, Bagamoyo",
      region: pwani,
      district: bagamoyo,
      ward: dunda,
      lat: -6.442,
      lng: 38.904,
      bedrooms: 0,
      bathrooms: 0,
      parking: 0,
      size: 0,
      land: 4856,
      year: null,
      furnished: "UNFURNISHED",
      listedById: owner.id,
      ownerId: owner.id,
      categoryId: categories[2].id,
      images: ["1500382017468-9049fed747ef", "1628624747186-a941c476b7ef", "1558904541-efa843a96f01"],
      amenityNames: ["Garden"],
      views: 266,
      favorites: 22,
    },
    {
      title: "Warehouse with yard in Ubungo",
      description:
        "Industrial warehouse on Nelson Mandela Road with 8m eaves, loading dock, and walled yard. Close to the dry port.",
      propertyType: "WAREHOUSE",
      listingType: "FOR_RENT",
      price: 18_000_000,
      address: "Nelson Mandela Road, Ubungo",
      region: dar,
      district: ubungo,
      ward: mwenge,
      lat: -6.792,
      lng: 39.21,
      bedrooms: 0,
      bathrooms: 2,
      parking: 10,
      size: 1600,
      land: 3200,
      year: 2014,
      furnished: "UNFURNISHED",
      listedById: agent.id,
      categoryId: categories[4].id,
      images: ["1586528116311-ad8dd3c8310d", "1565610226426-c9592ac71054", "1553413077-027d717d5d14"],
      amenityNames: ["Parking", "Security", "CCTV", "Generator"],
      views: 143,
      favorites: 7,
    },
    {
      title: "Boutique hotel in Stone Town",
      description:
        "Restored 12-key hotel with a rooftop restaurant and courtyard pool. Operating with a loyal European clientele and room to expand.",
      propertyType: "HOTEL",
      listingType: "FOR_SALE",
      price: 3_200_000_000,
      address: "Shangani, Stone Town",
      region: zanzibar,
      district: mjini,
      ward: shangani,
      lat: -6.164,
      lng: 39.192,
      bedrooms: 12,
      bathrooms: 14,
      parking: 6,
      size: 1100,
      land: 900,
      year: 2012,
      furnished: "FURNISHED",
      listedById: agent2.id,
      categoryId: categories[3].id,
      images: ["1566073771259-6a8506099945", "1551882547-ffb151fe0cda", "1520250497591-24bdd331989e"],
      amenityNames: ["Swimming Pool", "Sea View", "Furnished Kitchen", "Internet", "Air Conditioning"],
      views: 301,
      favorites: 19,
    },
    {
      title: "Coffee farm with homestead, Arusha",
      description:
        "18-acre coffee farm on the slopes of Mount Meru with a 4-bedroom homestead, drying tables, and irrigation from a seasonal river.",
      propertyType: "FARM",
      listingType: "FOR_SALE",
      price: 780_000_000,
      address: "Tengeru, Arusha",
      region: arusha,
      district: arushaCity,
      ward: tengeru,
      lat: -3.376,
      lng: 36.854,
      bedrooms: 4,
      bathrooms: 3,
      parking: 4,
      size: 240,
      land: 72843,
      year: 2005,
      furnished: "SEMI_FURNISHED",
      listedById: agent2.id,
      ownerId: owner.id,
      categoryId: categories[5].id,
      images: ["1500382017468-9049fed747ef", "1464226184884-fa280b87c399", "1444858295415-5bad7b4c2fb0"],
      amenityNames: ["Garden", "Water Tank", "Generator", "Pet Friendly"],
      views: 188,
      favorites: 15,
    },
    {
      title: "Family house in Mbezi Beach",
      description:
        "Five-bedroom detached house with a large garden, DSQ, and room for a pool. Quiet cul-de-sac near the beach and shopping centres.",
      propertyType: "HOUSE",
      listingType: "FOR_SALE",
      price: 420_000_000,
      address: "Mbezi Beach, Kawe",
      region: dar,
      district: kinondoni,
      ward: mbezi,
      lat: -6.7,
      lng: 39.22,
      bedrooms: 5,
      bathrooms: 4,
      parking: 3,
      size: 320,
      land: 1100,
      year: 2015,
      furnished: "UNFURNISHED",
      listedById: agent.id,
      categoryId: categories[0].id,
      images: ["1570129477492-45c003edd2be", "1600047509807-ba8f99d2cdbc", "1600566753190-17f0baa2a6c3"],
      amenityNames: ["Garden", "Security", "Parking", "Servant Quarter", "Water Tank"],
      views: 505,
      favorites: 48,
    },
    {
      title: "Modern apartment near Mwenge",
      description:
        "Two-bedroom apartment opposite the Mwenge crafts market with elevator access, fibre internet, and a shared gym.",
      propertyType: "APARTMENT",
      listingType: "FOR_RENT",
      price: 950_000,
      address: "Sam Nujoma Road, Mwenge",
      region: dar,
      district: kinondoni,
      ward: mwenge,
      lat: -6.772,
      lng: 39.229,
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      size: 88,
      land: 0,
      year: 2020,
      furnished: "FURNISHED",
      listedById: agent.id,
      categoryId: categories[0].id,
      images: ["1522708323590-d24dbb6b0267", "1502672260266-1c1ef2d93688", "1560185127-6a2c3d0d3e52"],
      amenityNames: ["Elevator", "Gym", "Internet", "Parking", "Security"],
      views: 333,
      favorites: 29,
    },
    {
      title: "Oyster Bay diplomat residence",
      description:
        "Gated 5-bedroom residence with mature trees, generator house, and a tennis lawn. Minutes from the High Commissions.",
      propertyType: "HOUSE",
      listingType: "FOR_RENT",
      price: 8_500_000,
      address: "Toure Drive, Oyster Bay",
      region: dar,
      district: kinondoni,
      ward: masaki,
      lat: -6.753,
      lng: 39.283,
      bedrooms: 5,
      bathrooms: 5,
      parking: 5,
      size: 410,
      land: 1600,
      year: 2009,
      furnished: "FURNISHED",
      listedById: agent.id,
      ownerId: owner.id,
      categoryId: categories[0].id,
      images: ["1600585154526-990dced4db0d", "1600210492493-94d14d8c1f86", "1613490493576-7fde57ac9025"],
      amenityNames: ["Garden", "Security", "Generator", "Servant Quarter", "CCTV", "Air Conditioning"],
      views: 276,
      favorites: 18,
    },
    {
      title: "Plotted land near Dodoma CBD",
      description:
        "Half-acre plot in a planned neighbourhood 12 minutes from government offices. Title in process, survey complete.",
      propertyType: "LAND",
      listingType: "FOR_SALE",
      price: 48_000_000,
      address: "Nzuguni, Dodoma",
      region: dodoma,
      district: dodomaCity,
      ward: nzuguni,
      lat: -6.163,
      lng: 35.752,
      bedrooms: 0,
      bathrooms: 0,
      parking: 0,
      size: 0,
      land: 2023,
      year: null,
      furnished: "UNFURNISHED",
      listedById: owner.id,
      ownerId: owner.id,
      categoryId: categories[2].id,
      images: ["1628624747186-a941c476b7ef", "1500382017468-9049fed747ef"],
      amenityNames: [],
      views: 97,
      favorites: 6,
      verification: "PENDING",
    },
    {
      title: "Lakeside commercial building, Mwanza",
      description:
        "Three-storey mixed-use building facing Lake Victoria. Ground floor retail, two office floors, rooftop terrace.",
      propertyType: "COMMERCIAL_BUILDING",
      listingType: "FOR_SALE",
      price: 1_150_000_000,
      address: "Kenyatta Road, Mwanza",
      region: mwanza,
      district: nyamagana,
      ward: mirongo,
      lat: -2.516,
      lng: 32.9,
      bedrooms: 0,
      bathrooms: 8,
      parking: 16,
      size: 1400,
      land: 900,
      year: 2017,
      furnished: "UNFURNISHED",
      listedById: agent2.id,
      categoryId: categories[1].id,
      images: ["1486406146926-c627a92ad1ab", "1464146072230-91cddd6f9333", "1497366811353-6870744d04b2"],
      amenityNames: ["Elevator", "Parking", "Security", "Generator"],
      views: 154,
      favorites: 11,
    },
    {
      title: "Affordable 3-bedroom house in Sinza",
      description:
        "Well-kept family house with a small garden, tiled throughout, and a newly renovated kitchen. Close to daladala routes.",
      propertyType: "HOUSE",
      listingType: "FOR_SALE",
      price: 185_000_000,
      address: "Sinza Mori",
      region: dar,
      district: kinondoni,
      ward: sinza,
      lat: -6.787,
      lng: 39.224,
      bedrooms: 3,
      bathrooms: 2,
      parking: 2,
      size: 160,
      land: 400,
      year: 2011,
      furnished: "UNFURNISHED",
      listedById: owner.id,
      ownerId: owner.id,
      categoryId: categories[0].id,
      images: ["1568605114967-8130f3a36994", "1570129477492-45c003edd2be", "1600566753086-5f6d3d1a0f0d"],
      amenityNames: ["Parking", "Water Tank", "Security"],
      views: 447,
      favorites: 39,
    },
    {
      title: "Makongo hillside bungalow",
      description:
        "Quiet 4-bedroom bungalow with cool breezes, fruit trees, and a view towards the University of Dar es Salaam.",
      propertyType: "HOUSE",
      listingType: "FOR_SALE",
      price: 260_000_000,
      address: "Makongo Juu",
      region: dar,
      district: kinondoni,
      ward: makongo,
      lat: -6.755,
      lng: 39.2,
      bedrooms: 4,
      bathrooms: 3,
      parking: 2,
      size: 210,
      land: 800,
      year: 2013,
      furnished: "SEMI_FURNISHED",
      listedById: agent.id,
      categoryId: categories[0].id,
      images: ["1600047509807-ba8f99d2cdbc", "1600566752355-357e278e7563", "1600585154340-be6161a56a0c"],
      amenityNames: ["Garden", "Parking", "Water Tank", "Generator"],
      views: 219,
      favorites: 17,
    },
    {
      title: "Arusha CBD shop to lease",
      description:
        "Corner shop on Sokoine Road with glass frontage and a small office mezzanine. High tourist and local traffic.",
      propertyType: "SHOP",
      listingType: "LEASE",
      price: 1_600_000,
      address: "Sokoine Road, Arusha",
      region: arusha,
      district: arushaCity,
      ward: sokoine,
      lat: -3.37,
      lng: 36.694,
      bedrooms: 0,
      bathrooms: 1,
      parking: 1,
      size: 48,
      land: 0,
      year: 2010,
      furnished: "UNFURNISHED",
      listedById: agent2.id,
      categoryId: categories[1].id,
      images: ["1441986300917-64674bd600d8", "1472851298518-b7d4161b4c7d"],
      amenityNames: ["Security"],
      views: 88,
      favorites: 4,
    },
    {
      title: "Coco Beach penthouse with sea view",
      description:
        "Top-floor penthouse overlooking Coco Beach. Open-plan living, two suites, smart home lighting, and a private terrace.",
      propertyType: "APARTMENT",
      listingType: "FOR_SALE",
      price: 680_000_000,
      address: "Coco Beach, Msasani",
      region: dar,
      district: kinondoni,
      ward: masaki,
      lat: -6.76,
      lng: 39.273,
      bedrooms: 3,
      bathrooms: 3,
      parking: 2,
      size: 210,
      land: 0,
      year: 2022,
      furnished: "FURNISHED",
      listedById: agent.id,
      categoryId: categories[0].id,
      images: ["1512917774080-9991f1c4c750", "1600607687644-c71785b4c2b0", "1600210492493-94d14d8c1f86"],
      amenityNames: ["Sea View", "Elevator", "Gym", "Air Conditioning", "Internet", "Balcony"],
      views: 521,
      favorites: 61,
    },
  ];

  const created = [];
  for (const item of listings) {
    const property = await prisma.property.create({
      data: {
        title: item.title,
        description: item.description,
        propertyType: item.propertyType,
        listingType: item.listingType,
        price: item.price,
        currency: "TZS",
        address: item.address,
        regionId: item.region.id,
        districtId: item.district.id,
        wardId: item.ward.id,
        regionName: item.region.name,
        districtName: item.district.name,
        wardName: item.ward.name,
        latitude: item.lat,
        longitude: item.lng,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        parkingSpaces: item.parking,
        propertySize: item.size,
        landSize: item.land,
        yearBuilt: item.year,
        furnished: item.furnished,
        listedById: item.listedById,
        ownerId: item.ownerId,
        categoryId: item.categoryId,
        verificationStatus: item.verification ?? "APPROVED",
        availabilityStatus: "AVAILABLE",
        viewsCount: item.views,
        favoritesCount: item.favorites,
        media: {
          create: item.images.map((id, index) => ({
            url: img(id),
            type: "IMAGE",
            sortOrder: index,
            isCover: index === 0,
          })),
        },
        amenities: {
          create: item.amenityNames.map((name) => ({ amenityId: amenity(name) })),
        },
      },
    });
    created.push(property);
  }

  const villa = created[0];
  const apt = created[1];
  const house = created[9];
  const penthouse = created[created.length - 1];

  await prisma.favorite.createMany({
    data: [
      { userId: customer.id, propertyId: villa.id },
      { userId: customer.id, propertyId: house.id },
      { userId: customer.id, propertyId: penthouse.id },
      { userId: customer2.id, propertyId: apt.id },
      { userId: customer2.id, propertyId: penthouse.id },
    ],
  });

  await prisma.viewingRequest.createMany({
    data: [
      {
        propertyId: villa.id,
        customerId: customer.id,
        agentId: agent.id,
        date: "2026-08-22",
        time: "10:00",
        message: "We would like a morning viewing for a family of four.",
        status: "PENDING",
      },
      {
        propertyId: house.id,
        customerId: customer.id,
        agentId: agent.id,
        date: "2026-08-19",
        time: "15:30",
        message: "Interested in the garden and school commute.",
        status: "CONFIRMED",
      },
      {
        propertyId: apt.id,
        customerId: customer2.id,
        agentId: agent.id,
        date: "2026-08-12",
        time: "11:00",
        status: "COMPLETED",
      },
    ],
  });

  const conversation = await prisma.conversation.create({
    data: {
      userAId: customer.id,
      userBId: agent.id,
      propertyId: villa.id,
      lastMessage: "Is the generator included in the asking price?",
      lastMessageAt: new Date(),
      messages: {
        create: [
          {
            senderId: customer.id,
            body: "Hello Daniel, I saved the Masaki villa. Is it still available this month?",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
            readAt: new Date(),
          },
          {
            senderId: agent.id,
            body: "Yes Samya, it is available. I can arrange a viewing on Friday morning.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
            readAt: new Date(),
          },
          {
            senderId: customer.id,
            body: "Is the generator included in the asking price?",
            createdAt: new Date(),
          },
        ],
      },
    },
  });

  await prisma.searchHistory.createMany({
    data: [
      { userId: customer.id, query: "house in Dar es Salaam", filters: JSON.stringify({ bedrooms: 5, maxPrice: 500000000 }) },
      { userId: customer.id, query: "Masaki villa", filters: JSON.stringify({ location: "Masaki" }) },
      { userId: customer.id, query: "apartments three bedrooms", filters: JSON.stringify({ type: "APARTMENT", bedrooms: 3 }) },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customer.id,
        title: "Viewing confirmed",
        body: "Your appointment for the Mbezi Beach family house is confirmed for 19 Aug at 15:30.",
        type: "viewing",
        link: "/dashboard/viewings",
      },
      {
        userId: agent.id,
        title: "New viewing request",
        body: "Samya Hassan requested a visit to the Masaki villa.",
        type: "viewing",
        link: "/dashboard/viewings",
      },
      {
        userId: agent.id,
        title: "New message",
        body: "Samya: Is the generator included in the asking price?",
        type: "message",
        link: `/messages?c=${conversation.id}`,
      },
      {
        userId: admin.id,
        title: "Listing awaiting approval",
        body: "Plotted land near Dodoma CBD was submitted and needs review.",
        type: "listing",
        link: "/dashboard/admin/properties",
      },
    ],
  });

  await prisma.report.create({
    data: {
      reporterId: customer2.id,
      propertyId: created[4].id,
      reason: "Inaccurate price",
      details: "The advertised rent appears higher than the board outside the shop.",
    },
  });

  await prisma.setting.createMany({
    data: [
      { key: "siteName", value: "EstateHub" },
      { key: "supportEmail", value: "support@estatehub.com" },
      { key: "defaultCurrency", value: "TZS" },
      { key: "featuredCity", value: "Dar es Salaam" },
      { key: "requireListingApproval", value: "true" },
    ],
  });

  console.log("EstateHub seed complete.");
  console.log("Demo logins (password: EstateHub@2026)");
  console.log(" admin@estatehub.com / agent@estatehub.com / owner@estatehub.com / customer@estatehub.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
