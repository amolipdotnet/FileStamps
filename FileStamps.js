console.log("🟡 FileStamps.js :: process.cwd() = " + process.cwd()); 

const myCwd = "/home/amolip/playground/FileStamps";

// const { parse } = require(myCwd + "/node_modules/yaml");
const { parse } = require("yaml");


const { path, readdirSync, readFileSync, writeFileSync, lstatSync } = require("node:fs");

const getDateTime = require( "./getDateTime.js" );

/**
 * @About Provides data from "./config.yaml".
 * @returns A **destructured object** with … 
 * @returns root -> The root-directory of the Obsidan vault (with path).
 * @returns stamp_file -> …/FileStamps.yaml (with path)
 * @returns exclude -> RegEx-Pattern as RegExp-Object
 */
function getConfigDataFromFile() {

    // const config_data = readFileSync(myCwd + "config.yaml", "utf8", (err) => 
    //     { if (err) throw(err);});    
    
    const config_data = readFileSync( myCwd + "/config.yaml", "utf8", (err) => 
        { if (err) throw(err);});    

    let { root, stamp_file: stampFile, exclude: excludeString } 
        = parse(config_data);

  
    // stampFile = myCwd + stampFile;

    const exclude = new RegExp(excludeString);
    // let exclude = "";
    return { root, stampFile, exclude };

    /**
     * Why not just "return parse(configData)"?
     * Because "explicit" is better than "implicit" in terms of intelligibility!
     */
    
};


/**
 * @About Reads the defined stamp data of the stamp_file (FileStamps.yaml)
 * @param {*} stamp_file: String 
 * @returns A StampData-Object, refined for further processing.
 * @returns e.g. { … 'Function Stamps': [ ['°bundle', 0], ['°list', 0], … ] … }
*/
function getStampDataFromFile(stamp_file) {

    const stamp_data = readFileSync(stamp_file, "utf8", (err) => 
        { if (err) throw(err);});       
        
       
    let stamp_object = parse(stamp_data); 
  
   
    stamp_object.settings = {};
    stamp_object.settings.CategorizedStamps = [];

    for (const category in stamp_object) {

        if (category == "settings") continue;
        
        const value = stamp_object[category];

        if (value == "ID_NOCAT") {
            stamp_object.settings.ID_NOCAT = category;
            stamp_object[category] = [];
            continue;
        };

        if (value == "ID_WRONG") {
            stamp_object.settings.ID_WRONG = category;
            stamp_object[category] = [];
            continue;
        };

        if (value == "ID_DATE") {
            stamp_object.settings.ID_DATE = category;
            stamp_object[category] = [];
            continue;
        };


        value.forEach ( (stamp, index) => {
            value[index] = [stamp, 0 ];
            // stamp_object.settings.CategorizedStamps.push(stamp);
        } );

    };


    return stamp_object;

};

/*
Warum die Funktion in der Funktion?
- Eine Notwendigkeit gibt es nicht.
- Ich spiele einfach herum.
- Ich benötige einen Zwischenspeicher (file_buffer) 
  mit einem leeren Array als Initialwert. 
  So etwas muss und sollte daher auch nicht von außen sichtbar sein,
  weswegen ich aufgrund der Rekursion zwei Funktionen benötige. 
*/
/*
readdirSync gibt es auch mit Rekursion und das funktioniert normalerweise auch.
-> readdirSync(root,{recursive: true})
Aber - Wenn der Aufruf über Obsidian erfolgt, dann **nicht**!
Keine Ahnung warum nicht?
*/
/**
 * 
 * @param {*} root 
 * @param {*} exclude RegExp-Object from "config.yaml"
 * @returns An Array with file names + extension (without path)
 */
function getFileNames(root, exclude) {


    function getFiles(file_buffer, path, exclude) {

            
        const files_folders = readdirSync(path)
            .filter(file_folder => !exclude.test(file_folder));
        
        files_folders.forEach(file_folder => {
    
            file_folder = path + "/" + file_folder;
    
            if (lstatSync(file_folder).isDirectory()) {
                getFiles(file_buffer,file_folder, exclude);
            } else {
                file_buffer.push(file_folder.split("/").reverse()[0]);
            };
    
        });
    
        return file_buffer;
        
    };


    const all_files = getFiles([],root, exclude);

    return all_files;

};

/**
 * @About Extracts the stamps from the file names.
 * @param {*} file_names 
 * @returns A Map-Object which contains the extracted stamps.
 * @returns These stamps are divided into three categories.
 */
function getUsedStamps(file_names) {

    const used_stamps = new Map( [
        ["stamps", []],
        ["dates", []],
        ["wrongs", []],
    ]);

    const stamps = used_stamps.get("stamps");
    const dates  = used_stamps.get("dates");
    const wrongs = used_stamps.get("wrongs");

    const stamp_regex = /°.*?(?=\s|\.|$)/g;
    const date_regex = /\s°\d{4}.*?(?=\s°|\.|$)/g;
    const wrong_regex = /(\S°|°[\s.])/g; // /(°|\s){2,}|°\S+?\s[^°]|°\S*°|°\s|°$/


    file_names.forEach(name => {

        let rest_of_name = name;
        let tmp_name = name;

        const wrong_parts = rest_of_name.match(wrong_regex);
        if (wrong_parts != null) {
 
            wrong_parts.forEach( (part, index) => {
                rest_of_name = rest_of_name.replace(part, "");
                tmp_name = tmp_name.replace(part, "»$&«");
            });
            name = "[[" + name + "|" + tmp_name + "]]";
            wrongs.push(name);

        };
        
        const date_parts = rest_of_name.match(date_regex);
        if (date_parts != null) {

            date_parts.forEach( (part, index) => {

                rest_of_name    = rest_of_name.replace(part, "");
                part            = part.trim();
                name            = name.replace(part, "»$&«");

                dates.push(part);

            });

        };

        const stamp_parts = rest_of_name.match(stamp_regex);
        if (stamp_parts != null) {

            stamp_parts.forEach( (part, index) => stamps.push(part));

        };

    });

    dates.sort();

    return used_stamps; 

};

/**
 * 
 * @param {*} stamp_data -> The defined stamps from "FileStamps.yaml"
 * @param {*} used_stamps -> The **actually occurring** stamps.
 * @returns 
 */
function updateData(stamp_data, used_stamps) {

    let valid_used_stamps = used_stamps.get("stamps");
    let wrong_used_stamps = used_stamps.get("wrongs");
    let date_used_stamps = used_stamps.get("dates");
    // console.table(valid_used_stamps)
    for (const category in stamp_data) {

        if (category == "settings") continue;

        if (category == stamp_data.settings.ID_NOCAT) continue;

        if (category == stamp_data.settings.ID_WRONG) {

            // stamp_data[category].push(wrong_used_stamps);
            wrong_used_stamps.forEach( stamp => stamp_data[category].push(stamp));
            continue;
            
        };

        if (category == stamp_data.settings.ID_DATE) {
           
            const dates = date_used_stamps.reduce((dates_heap, date_used_stamp) => dates_heap.set(date_used_stamp, (dates_heap.get(date_used_stamp) || 0) + 1), new Map());

            stamp_data[category].push(...dates);

            continue;
        };

       

        stamp_data[category].forEach ( (stamp) => {
            valid_used_stamps.forEach((valid_used_stamp, index) => {
                if (stamp[0] == valid_used_stamp) {
                    stamp[1]++;
                    valid_used_stamps.splice(index, 1, null);
                };
            });
        });
            
    };

    valid_used_stamps = valid_used_stamps.filter(stamp => stamp);
   
    stamp_data[stamp_data.settings.ID_NOCAT] = ( (leftover_stamps = valid_used_stamps) => {
        
        const uncategorized_stamps = [];
       
    
        while (leftover_stamps.length > 0) {
   
            let litmus_stamp = leftover_stamps[0];
            let litmus_counter = 0;

            /**
             * This loop …
             * … shrinks the "leftover_stamps" to stamps <> litmus_stamp
             * … counts the number of "litmus_stamp" in "leftover_stamps"
             */
            leftover_stamps = leftover_stamps.filter( stamp => {

                if (stamp != litmus_stamp) return true;
                // stamp gets part of the new leftover_stamps

                ++litmus_counter; // nothing else happens
                // stamp gets no part of the new leftover_stamps, leftover_stamps is shrinked
                // return false; You can, but you don't need. No return is as good as any "Falsy" return.
         
            });

            uncategorized_stamps.push([litmus_stamp, litmus_counter]);

        };
  
        return uncategorized_stamps;

    })();
        
    return stamp_data;

};


function createContent(root, stamp_file, stamp_data) {

    let content = "";


    content += `---\nobsidianUIMode: preview`;
    content += `\naliases:\n - "List of File-Stamps ≡"\n - "lof file stamps ≡"`;
    content += `\ntags:\n - oms\n---\n\n`;

    content += `- created: ${getDateTime()}\n\n`;

  
    content += `- [[${stamp_file.split("/").reverse()[0]}]]\n\n`;

    for (const category in stamp_data) {

        if (category == "settings") continue;

        const stamps = stamp_data[category];

        content += `\n\n# ${category}\n`;

        if (category == stamp_data.settings.ID_WRONG) {
    
            stamps.forEach(stamp => content += `\n- ${stamp}`);
            continue;

        };

        stamps.forEach(stamp => content += `\n- ${stamp[0]} (${stamp[1]})`);

    };

    writeFileSync(root + "/List of File-Stamps °list.md",content)

    return content;

};


// Aufrufe
// run_me();

module.exports = run_me;

function run_me() {

    const { root, stampFile, exclude } = getConfigDataFromFile();
    // console.log("\n»»» getConfigDataFromFile() «««");
    // console.log({ root, stampFile, exclude });

    let stampData = getStampDataFromFile(stampFile); 
    // console.log("\n»»» let stampData = getStampDataFromFile(…) «««");
    // console.log(stampData);
  
    const fileNames = getFileNames(root, exclude);
    // console.log("\n»»» const fileNames = getFileNames(…) «««");
    // console.log(fileNames);

    const usedStamps = getUsedStamps(fileNames);
    // console.log("\n»»» const usedStamps = getUsedStamps(…) «««");
    // console.log(usedStamps);
    
    stampData = updateData(stampData, usedStamps);
    // console.log("\n»»» stampData = updateData(…) «««");
    // console.log(stampData);
    
    const content = createContent(root,stampFile, stampData);
    // console.log("\n»»» content = createContent…) «««");
    // console.log(content);

};