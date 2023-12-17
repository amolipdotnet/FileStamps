/**
 *  
 *  
 */

module.exports = {};

const doit = true;
let userPlugins;

module.exports.onload = async (plugin) => {

    console.log('# Loading File Stamp');

    userPlugins = plugin; // Hilfskonstruktion

    await plugin.addCommand({
        id: 'id_FileStamps',
        name: 'Get File Stamps',
        callback: async () => {
            startGame(doit);
        }
    });

    await plugin.addRibbonIcon('tags', 'Get File Stamps', () => {
        startGame(doit);
    });

};

module.exports.onunload = function (plugin) {
    console.log('# Unloading File Stamp');
}

function startGame() {
    console.log('# startGame');
};