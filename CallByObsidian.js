module.exports = {} // necessary for the "User Plugins".

console.log("🔴 app.js :: process.cwd() = " + process.cwd()); 

// const myCwd + "/home/amolip/topics/_utils/_scripts/FileStamps";
const myCwd = "/home/amolip/playground/FileStamps";

const run = require( myCwd + "/FileStamps.js" );
// const run = require(  "./FileStamps.js" ); 👎

let userPlugins;

module.exports.onload = async (plugin) => {

    console.log('Loading File Stamp Script...');

    userPlugins = plugin; // Hilfskonstruktion

    await plugin.addCommand({
        id: 'id_FileStamps',
        name: 'Get File Stamps',
        callback: async () => {
            startGame();
        }
    });

    await plugin.addRibbonIcon('tags', 'Get File Stamps', () => {
        startGame();
    });

}

module.exports.onunload = function (plugin) {
    console.log('Unloading File Stamp Script...');
}

function startGame() {

    console.log("startGame");
    console.log("🔴 app.js :: process.cwd() = " + process.cwd()); 
    run();

};
