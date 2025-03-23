const fs = require('fs').promises;
const path = require('path');
const Tesseract = require('tesseract.js');

let extractedText;

const filePath = 'output.txt';

// async function extractTextFromImages(folderPath, outputFile = 'output.txt') {
//     try {
//         // Read all files in the folder
//         const files = await fs.readdir(folderPath);
        
//         // Filter for image files (jpg, jpeg, png, gif)
//         const imageFiles = files.filter(file => 
//             /\.(jpg|jpeg|png|gif)$/i.test(file)
//         );

//         if (imageFiles.length === 0) {
//             console.warn(`No image files found in ${folderPath}`);
//             return;
//         }

//         let allExtractedText = '';

//         // Process each image
//         for (const file of imageFiles) {
//             const imagePath = path.join(folderPath, file);
//             console.log(`Processing: ${file}`);

//             try {
//                 // Extract text using Tesseract
//                 const { data: { text } } = await Tesseract.recognize(
//                     imagePath,
//                     'eng', // English language
//                     {
//                         logger: m => console.log(`${file}: ${m.status}`)
//                     }
//                 );

//                 // Add extracted text with file info and separator
//                 allExtractedText += `File: ${file}\n${text}\n---\n`;
//             } catch (error) {
//                 console.error(`Error processing ${file}:`, error);
//                 allExtractedText += `File: ${file}\nError extracting text: ${error.message}\n---\n`;
//             }
//         }

//         // Write all text to output file
//         await fs.writeFile(outputFile, allExtractedText.trim(), 'utf8');
//         console.log(`Text extracted from ${imageFiles.length} images and saved to ${outputFile}`);

//     } catch (error) {
//         console.error('Error in extractTextFromImages:', error);
//         throw error;
//     }
// }

// // Example usage
// async function main() {
//     try {
//         await extractTextFromImages('extracted_images');
//     } catch (error) {
//         console.error('Main execution failed:', error);
//     }
// }
// main()



async function readFileData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        if (!data.trim()) {
            console.warn(`File ${filePath} is empty!`);
            return [];
        }
        extractedText = data;
        console.log(`File contents from ${filePath}:`);
        console.log(extractedText);
        const lines = extractedText.split('\n');
        console.log('Lines as array:', lines);
        return lines;
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err.message);
        throw err;
    }
}

function parseExtractedText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
    const mainSection = {
        horseName: null,
        usefNumber: null,
        dam: null,
        sire: null,
        foalDate: null,
        breed: null,
        owners: [],
    };
  
    const portions = [];
    let currentPortion = null;
    let currentSection = null;
    let currentHeaders = null;
  
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        console.log(`Processing line ${i}: "${line}"`);
  
        // Main section parsing with null defaults
        const horseMatch = line.match(/^Se\s+VALENCIA\s*\((\d+)\)/);
        if (horseMatch && !mainSection.horseName) {
            mainSection.horseName = 'VALENCIA';
            mainSection.usefNumber = horseMatch[1];
        }
        const damMatch = line.match(/Dam:\s*([A-Z\s]+)\s*Microchip:/);
        if (damMatch && !mainSection.dam) mainSection.dam = damMatch[1].trim();
        const foalDateMatch = line.match(/Foal Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (foalDateMatch && !mainSection.foalDate) mainSection.foalDate = foalDateMatch[1];
        const breedMatch = line.match(/Breed:\s*([A-Z\s]+)/);
        if (breedMatch && !mainSection.breed) mainSection.breed = breedMatch[1].trim();
        const sireMatch = line.match(/Sire:\s*([A-Z\s]+)/);
        if (sireMatch && !mainSection.sire) mainSection.sire = sireMatch[1].trim();
        const ownerMatch = line.match(/Owner:\s*(?:~~\s*)?([A-Z,\s]+\s*\(\d+\))/);
        if (ownerMatch) mainSection.owners.push(ownerMatch[1].trim());
  
        // Portion detection
        const normalizedLine = line.replace(/\s+/g, ' ').trim();
        const showIdMatch = normalizedLine.match(/(\d+)\s+(\d{4}\s+[A-Z\s]+)/);
        const jumperLevelMatch = normalizedLine.match(/Jumper Level:\s*(\d+)/);
  
        if (showIdMatch && jumperLevelMatch) {
            const startDateMatch = normalizedLine.match(/Start Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
            const endDateMatch = normalizedLine.match(/End Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
            const stateMatch = normalizedLine.match(/State:\s*([A-Z]{2})/);
            const zoneMatch = normalizedLine.match(/Zone:\s*(\d+)/);
  
            currentPortion = {
                show: `${showIdMatch[1]} ${showIdMatch[2].trim()}`,
                jumperLevel: jumperLevelMatch[1],
                startDate: startDateMatch ? startDateMatch[1] : null,
                endDate: endDateMatch ? endDateMatch[1] : null,
                state: stateMatch ? stateMatch[1] : null,
                zone: zoneMatch ? zoneMatch[1] : null,
                owner: null,
                sections: [],
            };
            console.log(`Portion detected: ${currentPortion.show}`);
  
            for (let j = 1; j <= 3 && (i + j) < lines.length; j++) {
                const nextLine = lines[i + j];
                const ownerMatch = nextLine.match(/Owner at the Competition:\s*([A-Z,\s]+\s*\(\d+\))/);
                if (ownerMatch) {
                    currentPortion.owner = ownerMatch[1].trim();
                    i += j;
                    break;
                }
            }
  
            portions.push(currentPortion);
        }
  
        // Section detection
        if (line.startsWith('SECTION:')) {
            if (!currentPortion) {
                currentPortion = { 
                    show: 'Unknown Show', 
                    jumperLevel: null, 
                    startDate: null, 
                    endDate: null, 
                    state: null, 
                    zone: null, 
                    owner: null, 
                    sections: [] 
                };
                portions.push(currentPortion);
            }
            const sectionName = line.replace('SECTION: ', '');
            currentSection = { sectionName, rows: [] };
            currentPortion.sections.push(currentSection);
            const nextLine = lines[i + 1];
            if (nextLine && nextLine.match(/^\s*CLASS\s+/)) {
                currentHeaders = nextLine.split(/\s+/).filter(h => h);
                i++;
            }
        }
  
        // Row parsing with null defaults
        if (line.match(/^\d{3,4}\s+/) && currentSection && currentHeaders) {
            const parts = line.split(/\s+/);
            const heightIndex = parts.findIndex(p => p.match(/^\d\.\d{2}M$/));
            if (heightIndex === -1) continue;

            const row = {
                class: parts[0] || null,
                description: parts.slice(1, heightIndex).join(' ') || null,
                height: parts[heightIndex] || null,
                firstRound: '0',  // Default as per your logic
                secondRound: '0', // Default as per your logic
                placing: parts[heightIndex + 1] || null,
                competed: parts[heightIndex + 2] || null,
                money: parts[heightIndex + 3] || null,
                natPnt: parts[heightIndex + 4] || null, // Full value or null
                zrdPnt: parts[heightIndex + 5] || null, // Full value or null
                rider: parts.slice(heightIndex + 6).join(' ') || null
            };
            currentSection.rows.push(row);
        }
    }
  
    return { mainSection, portions };
}

function mapToCSVFormat(parsedData) {
    const csvRows = [];
    const headers = [
        'HORSENAME', 'USEF', 'DAM', 'SIRE', 'FOALDATE', 'BREED', 'OWNER', 'SECTION', 'CLASS',
        'DESCRIPTION', 'HEIGHT', 'PLACING', 'COMPETED', 'MONEY', 'NAT_PNT', 'ZRD_PNT', 'RIDER', 
        'ZONE', 'JUMPERLEVEL', 'STATE', 'STARTDATE', 'ENDDATE', 'FIRSTROUND', 'SECONDROUND', 'SHOW'
    ];
    csvRows.push(headers.join(','));

    const { mainSection, portions } = parsedData;

    for (const portion of portions) {
        for (const section of portion.sections) {
            for (const row of section.rows) {
                const csvRow = [
                    mainSection.horseName !== null ? `"${mainSection.horseName}"` : 'null',
                    mainSection.usefNumber !== null ? mainSection.usefNumber : 'null',
                    mainSection.dam !== null ? `"${mainSection.dam}"` : 'null',
                    mainSection.sire !== null ? `"${mainSection.sire}"` : 'null',
                    mainSection.foalDate !== null ? mainSection.foalDate : 'null',
                    mainSection.breed !== null ? `"${mainSection.breed}"` : 'null',
                    portion.owner !== null ? `"${portion.owner}"` : 'null',
                    section.sectionName !== null ? `"${section.sectionName}"` : 'null',
                    row.class !== null ? row.class : 'null',
                    row.description !== null ? `"${row.description}"` : 'null',
                    row.height !== null ? row.height : 'null',
                    row.placing !== null ? row.placing : 'null',
                    row.competed !== null ? row.competed : 'null',
                    row.money !== null ? row.money : 'null',
                    row.natPnt !== null ? `"${row.natPnt}"` : 'null', // Full value or null
                    row.zrdPnt !== null ? `"${row.zrdPnt}"` : 'null', // Full value or null
                    row.rider !== null ? `"${row.rider}"` : 'null',
                    portion.zone !== null ? portion.zone : 'null',
                    portion.jumperLevel !== null ? portion.jumperLevel : 'null',
                    portion.state !== null ? portion.state : 'null',
                    portion.startDate !== null ? portion.startDate : 'null',
                    portion.endDate !== null ? portion.endDate : 'null',
                    row.firstRound === '—' ? '0' : (row.firstRound || '0'),
                    row.secondRound === '—' ? '0' : (row.secondRound || '0'),
                    portion.show !== null ? `"${portion.show}"` : 'null',
                ];
                csvRows.push(csvRow.join(','));
                console.log(`CSV Row: ${csvRow.join(',')}`);
            }
        }
    }

    return csvRows.join('\n');
}

async function processFiles(filePaths) {
    let allCsvData = [
        'HORSENAME,USEF,DAM,SIRE,FOALDATE,BREED,OWNER,SECTION,CLASS,DESCRIPTION,HEIGHT,PLACING,COMPETED,MONEY,NAT_PNT,ZRD_PNT,RIDER,ZONE,JUMPERLEVEL,STATE,STARTDATE,ENDDATE,FIRSTROUND,SECONDROUND,SHOW'
    ];

    for (const filePath of filePaths) {
        console.log(`Processing file: ${filePath}`);
        await readFileData(filePath);

        if (!extractedText || !extractedText.trim()) {
            console.warn(`No data to process for ${filePath}`);
            continue;
        }

        const parsedData = parseExtractedText(extractedText);
        console.log(`Parsed Data for ${filePath}:`, JSON.stringify(parsedData, null, 2));

        const csvData = mapToCSVFormat(parsedData);
        console.log(`Generated CSV Data for ${filePath}:`, csvData);

        const rows = csvData.split('\n').slice(1);
        if (!rows.length) {
            console.warn(`No CSV rows generated for ${filePath}`);
        } else {
            allCsvData.push(...rows);
        }
    }

    console.log('Final CSV data to write:', allCsvData.join('\n'));
    try {
        if (allCsvData.length <= 1) {
            console.warn('No data rows to write to output.csv');
        } else {
            await fs.writeFile('output.csv', allCsvData.join('\n'), 'utf8');
            console.log('\nAll CSV data successfully saved to output.csv');
        }
    } catch (error) {
        console.error('Error writing CSV file:', error);
    }
}

async function processExtractedText() {
    const filePaths = ['output.txt'];
    await processFiles(filePaths);
}

processExtractedText().catch(err => console.error('Error in process:', err));

async function deleteAllFilesInFolder() {
    let folderPath = 'extracted_images';
    try {
        const files = await fs.readdir(folderPath);
        if (files.length === 0) {
            console.log(`No files found in ${folderPath}`);
            return;
        }
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            await fs.unlink(filePath);
            console.log(`Deleted: ${filePath}`);
        }
        console.log(`All files in ${folderPath} have been deleted.`);
    } catch (error) {
        console.error(`Error deleting files in ${folderPath}:`, error.message);
        throw error;
    }
}

// deleteAllFilesInFolder();
