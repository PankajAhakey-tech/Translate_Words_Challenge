const fs = require("fs");
const csv = require("csv-parser");
const { performance } = require("perf_hooks");

// Step 1: Read input text file, find words list file, and dictionary CSV file
const inputFile = "t8.shakespeare.txt";
const findWordsFile = "find_words.txt";
const dictionaryFile = "french_dictionary.csv";

// Read the input text file
const inputText = fs.readFileSync(inputFile, "utf8");

// Read the find words list file and prepare the list
const findWordsList = fs
    .readFileSync(findWordsFile, "utf8")
    .split("\n")
    .map((word) => word.trim());

// Create an empty dictionary object to store English-to-French word mappings
const dictionary = {};

// Read the dictionary CSV file and populate the dictionary object
fs.createReadStream(dictionaryFile)
    .pipe(csv({ headers: false }))
    .on("data", (data) => {
        const englishWord = data[0].trim();
        const frenchWord = data[1].trim();
        dictionary[englishWord] = frenchWord;
    })
    .on("end", () => {
        // Step 2: Find words in the find words list with replacements in the dictionary
        const wordsToReplace = findWordsList.filter((word) =>
            dictionary.hasOwnProperty(word)
        );

        // Step 3: Replace words in the input text file and calculate word frequencies
        const startTime = performance.now();
        let processedText = inputText;
        const wordFrequencies = {};

        wordsToReplace.forEach((word) => {
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            const matches = processedText.match(regex);
            if (matches) {
                const frequency = matches.length;
                processedText = processedText.replace(regex, dictionary[word]);
                wordFrequencies[word] = frequency;
            }
        });

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Step 4: Save the processed file as output
        const outputFile = "t8.shakespeare.translated.txt";
        fs.writeFileSync(outputFile, processedText, "utf8");

        // Save replaced words and frequencies in the "frequency.csv" file
        const frequencyFile = "frequency.csv";
        const frequencyContent = Object.entries(wordFrequencies)
            .map(([word, frequency]) => `${word},${dictionary[word]},${frequency}`)
            .join("\n");
        const frequencyHeader = "English word,French word,Frequency\n";
        fs.writeFileSync(frequencyFile, frequencyHeader + frequencyContent, "utf8");

        // Calculate memory usage
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

        // Print the results
        console.log("Processing completed. Output file saved as " + outputFile);
        console.log("Frequency data saved in " + frequencyFile);
        console.log("Number of times each word was replaced:");
        wordsToReplace.forEach((word) => {
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            const matches = processedText.match(regex);
            console.log(`${word}: ${matches ? matches.length : 0}`);
        });
        console.log("Time taken to process:", processingTime.toFixed(2) + "ms");
        console.log("Memory taken to process:", memoryUsage.toFixed(2) + "MB");
    });