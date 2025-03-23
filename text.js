const fs = require('fs').promises;

// The extracted text from the image (pasted here for reference)
const extractedText = `
Date Range: 3/13/2020 - 3/13/2025
US Equestrian Horse Report
Se VALENCIA (5274414) Sire: VALENTINO Z
us Breed: DUTCH WARMBLOOD Dam: MACHTELT Microchip: 981020023448395
Foal Date: 5/3/2012
EQUESTRIAN
Owner: CLAYTON, AMELIA (5492494) Owner Point State: ~~ TX (12/1/2020-11/30/2021), TX (1/17/2022-1/16/2026)
(Starts 4/15/2021)
Owner: KULISEK, JESSICA (5122548) Owner Point State: ~~ TX (9/9/2019-9/8/2020)
(5/10/2016 - 6/9/2020)
Owner: ~~ SENGBUSCH, ADDISON (5606377)
(6/10/2020 - 4/14/2021)
Leasee: ENGER, ADAM (5887347)
(2/12/2025 - 5/14/2025)
332927 2020 GREAT LAKES EQUESTRIAN FESTIVAL | Jumper Level: 5 Start Date: 7/1/2020 End Date: 7/5/2020 State: MI Zone: 5
(Owner at the Competition: SENGBUSCH, ADDISON (5606377)
SECTION: CHILDRENS JUMPER-LOW
CLASS DESCRIPTION HEIGHT PLACING COMPETED MONEY NAT PNT ZRD PNT RIDER
1055 LOW CHILDREN'S JUMPER II 2B 1.00M 6 8 0.00 0.00/0.00 0.00/4.00 SENGBUSCH, ADDISON (5606377)
1056 LOW CHILDREN'S JUMPER II 2B 1.00M 7 7 0.00 0.00/0.00 0.00/3.00 SENGBUSCH, ADDISON (5606377)
1057 LOW CHILDREN'S JUMPER (BONUS POINTS) II 1.05M 6 9 75.00 0.00/0.00 0.00/7.00 SENGBUSCH, ADDISON (5606377)
2B
TOTALS: 75.00 0.00/0.00 0.00/14.00
BAD POINT REASON: HORSE NOT SHOWN IN HOME ZONE, REGION, DISTRICT (GR1111.6)
SECTION: MISC JUMPER
CLASS DESCRIPTION HEIGHT PLACING COMPETED MONEY NAT PNT ZRD PNT RIDER
1091 95 JUMPER TABLE II 0.95M DNP 14 0.00 0.00/0.00 0.00/0.00 SENGBUSCH, ADDISON (5606377)
1095 1.00 JUMPER TABLE Il 1.00M DNP 21 0.00 0.00/0.00 0.00/0.00 VAN DER HOEVEN, MARTIEN
(241786)
TOTALS: 0.00 0.00/0.00 0.00/0.00
332364 2020 GREAT LAKES EQUESTRIAN FESTIVAL II Jumper Level: 5 Start Date: 7/8/2020 End Date: 7/12/2020 State: MI Zone: 5
(Owner at the Competition: SENGBUSCH, ADDISON (5606377)
SECTION: CHILDRENS JUMPER-LOW
CLASS DESCRIPTION HEIGHT PLACING COMPETED MONEY NAT PNT ZRD PNT RIDER
1055 LOW CHILDREN'S JUMPER II 2B 1.00M 5 21 0.00 0.00/0.00 0.00/11.00 SENGBUSCH, ADDISON (5606377)
1056 LOW CHILDREN'S JUMPER II 2B 1.00M 17 20 0.00 0.00/0.00 0.00/0.00 SENGBUSCH, ADDISON (5606377)
1057 LOW CHILDREN'S JUMPER (BONUS POINTS) II 1.05M 19 20 0.00 0.00/0.00 0.00/0.00 SENGBUSCH, ADDISON (5606377)
2B
US EQUESTRIAN HORSE REPORT VALENCIA (5274414) Page 1 of 30
`;

// Function to parse the extracted text
function parseExtractedText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // Main section data
  const mainSection = {
    horseName: '',
    usefNumber: '',
    dam: '',
    sire: '',
    foalDate: '',
    breed: '',
  };

  // Extract main section data
  for (const line of lines) {
    if (line.includes('VALENCIA (5274414)')) {
      mainSection.horseName = 'VALENCIA';
      mainSection.usefNumber = '5274414';
    }
    if (line.includes('Sire: VALENTINO Z')) {
      mainSection.sire = 'VALENTINO Z';
    }
    if (line.includes('Dam: MACHTELT')) {
      mainSection.dam = 'MACHTELT';
    }
    if (line.includes('Foal Date: 5/3/2012')) {
      mainSection.foalDate = '5/3/2012';
    }
    if (line.includes('Breed: DUTCH WARMBLOOD')) {
      mainSection.breed = 'DUTCH WARMBLOOD';
    }
  }

  // Array to hold all portions (shows)
  const portions = [];
  let currentPortion = null;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Identify a new portion (show)
    if (line.match(/^\d+ 2020 GREAT LAKES EQUESTRIAN FESTIVAL/)) {
      const showMatch = line.match(/^(\d+) (2020 GREAT LAKES EQUESTRIAN FESTIVAL [I]+)/);
      const jumperLevelMatch = line.match(/Jumper Level: (\d+)/);
      const stateMatch = line.match(/State: (\w+)/);
      const zoneMatch = line.match(/Zone: (\d+)/);

      currentPortion = {
        show: showMatch ? `${showMatch[1]} ${showMatch[2]}` : '',
        jumperLevel: jumperLevelMatch ? jumperLevelMatch[1] : '',
        state: stateMatch ? stateMatch[1] : '',
        zone: zoneMatch ? zoneMatch[1] : '',
        owner: '', // Will be set in the next line
        sections: [],
      };

      // Get the owner at the competition
      const nextLine = lines[i + 1];
      const ownerMatch = nextLine.match(/Owner at the Competition: (.+)/);
      if (ownerMatch) {
        currentPortion.owner = ownerMatch[1];
      }

      portions.push(currentPortion);
    }

    // Identify a new section within a portion
    if (line.startsWith('SECTION:')) {
      const sectionName = line.replace('SECTION: ', '');
      currentSection = {
        sectionName,
        rows: [],
      };
      currentPortion.sections.push(currentSection);
    }

    // Parse rows within a section
    if (line.match(/^\d{4} /) && currentSection) {
      const parts = line.split(/\s+/);
      const row = {
        class: parts[0],
        description: parts.slice(1, parts.indexOf(parts.find(p => p.match(/^\d\.\d{2}M$/)))).join(' '),
        height: parts.find(p => p.match(/^\d\.\d{2}M$/)),
        placing: parts[parts.indexOf(parts.find(p => p.match(/^\d\.\d{2}M$/))) + 1],
        competed: parts[parts.indexOf(parts.find(p => p.match(/^\d\.\d{2}M$/))) + 2],
        money: parts[parts.indexOf(parts.find(p => p.match(/^\d\.\d{2}M$/))) + 3],
        natPnt: parts[parts.indexOf(parts.find(p => p.match(/^\d\.\d{2}M$/))) + 4],
        zrdPnt: parts[parts.indexOf(parts.find(p => p.match(/^\d\.\d{2}M$/))) + 5],
        rider: parts.slice(parts.indexOf(parts.find(p => p.match(/^\d\.\d{2}M$/))) + 6).join(' '),
      };
      currentSection.rows.push(row);
    }
  }

  return { mainSection, portions };
}

// Function to map parsed data to CSV format
function mapToCSVFormat(parsedData) {
  const csvRows = [];
  const headers = [
    'HORSENAME', 'USEF', 'DAM', 'SIRE', 'FOALDATE', 'BREED', 'OWNER', 'SECTION', 'CLASS',
    'DESCRIPTION', 'HEIGHT', 'PLACING', 'COMPETED', 'MONEY', 'NAT', 'ZRD', 'RIDER', 'ZONE',
    'JUMPERLEVEL', 'STATE', 'FIRSTROUND', 'SECONDROUND', 'SHOW'
  ];
  csvRows.push(headers.join(','));

  const { mainSection, portions } = parsedData;

  for (const portion of portions) {
    for (const section of portion.sections) {
      for (const row of section.rows) {
        const [nat, zrd] = row.natPnt.split('/');
        const [firstRound, secondRound] = row.zrdPnt.split('/');
        const csvRow = [
          mainSection.horseName,
          mainSection.usefNumber,
          mainSection.dam,
          mainSection.sire,
          mainSection.foalDate,
          mainSection.breed,
          portion.owner,
          section.sectionName,
          row.class,
          row.description,
          row.height,
          row.placing,
          row.competed,
          row.money,
          nat,
          zrd,
          row.rider,
          portion.zone,
          portion.jumperLevel,
          portion.state,
          firstRound,
          secondRound,
          portion.show,
        ];
        csvRows.push(csvRow.join(','));
      }
    }
  }

  return csvRows.join('\n');
}

// Function to map parsed data to JSON format
function mapToJSONFormat(parsedData) {
  const { mainSection, portions } = parsedData;

  const jsonData = {
    mainSection: [
      { id: 'horseName', title: 'Horse Name', value: mainSection.horseName },
      { id: 'usefNumber', title: 'USEF #', value: mainSection.usefNumber },
      { id: 'dam', title: 'Dam', value: mainSection.dam },
      { id: 'sire', title: 'Sire', value: mainSection.sire },
      { id: 'foalDate', title: 'Foal Date', value: mainSection.foalDate },
      { id: 'breed', title: 'Breed', value: mainSection.breed },
    ],
    portions: portions.map(portion => ({
      portionDetails: [
        { id: 'owner', title: 'Owner', value: portion.owner },
        { id: 'show', title: 'Show', value: portion.show },
        { id: 'jumperLevel', title: 'Jumper Level', value: portion.jumperLevel },
        { id: 'state', title: 'State', value: portion.state },
        { id: 'zone', title: 'Zone', value: portion.zone },
      ],
      sections: portion.sections.map(section => ({
        sectionName: section.sectionName,
        rows: section.rows.map(row => ({
          class: row.class,
          description: row.description,
          height: row.height,
          placing: row.placing,
          competed: row.competed,
          money: row.money,
          natPnt: row.natPnt,
          zrdPnt: row.zrdPnt,
          rider: row.rider,
        })),
      })),
    })),
  };

  return jsonData;
}

// Main function to process the extracted text
async function processExtractedText() {
  // Parse the extracted text
  const parsedData = parseExtractedText(extractedText);

  // Map to JSON format and log for debugging
  const jsonData = mapToJSONFormat(parsedData);
  console.log('Parsed JSON Data:');
  console.log(JSON.stringify(jsonData, null, 2));

  // Map to CSV format
  const csvData = mapToCSVFormat(parsedData);
  console.log('\nCSV Data:');
  console.log(csvData);

  // Save CSV to file
  try {
    await fs.writeFile('output.csv', csvData, 'utf8');
    console.log('\nCSV data successfully saved to output.csv');
  } catch (error) {
    console.error('Error writing CSV file:', error);
  }
}

// Run the process
processExtractedText().catch(err => console.error('Error in process:', err));