import fs from 'fs';
import readline from 'readline';
import path from 'path';
import Queue from '../Queue';


module.exports = (csvFile, callback) => {
    // Props
    let API, keys, jsonData = { data: [] };

    // Read csvFile line by line
    const readInterface = readline.createInterface({
        input: fs.createReadStream(csvFile),
        output: null,
        console: false
    });

    // Push argument (objectified) to jsonData object
    const collect = csv_data => {
        let record = {}; 
        csv_data = csv_data.values();  // turn into iterator
        
        Array.from(keys, key => {
            record[key] = csv_data.next().value
        });
        
        jsonData['data'].push(record);
    };

    // Save data to File
    const save = (options = {}) => {
        
        const data = JSON.stringify(jsonData.data, null, 1);

        // extract name from csv file to be used as new json file name
        let file = path.basename(`${csvFile}`, '.csv');
        
        // Write data to file
        fs.writeFile(`./${file}.json`, data, 'utf8', (error, data) => {
            if (error) throw error;
            console.log(`Done. New file [ ${file}.json ] saved in current working directory`);
        });
    }
    
    //* Read and enqueue data from csvFile
    readInterface.on('line', data => {
        Queue.enqueue(data.replace("\n", "").split(','));
    });

    //? Done Reading from csvFile?
    readInterface.on('close', () => {
        keys = Queue.dequeue(); // Extract the first item from Queue, the column headers
        while(!Queue.is_empty()) collect(Queue.dequeue()); // Extract everything else from Queue

        // Public API
        API = {
            data: jsonData.data,
            save
        }

        // Serve API as callback argument
        callback(API);
    });
}