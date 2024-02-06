/**
 * version: 1.0.0
 * home: topics
 * Delivers the current date and time with the defined format,
 * e.g. °2023-06-17 °13:50:45
 * @returns current date/time as string 
 */
const getDateTime = () => {
    
    const DATE = new Date();

    const YEAR = DATE.getFullYear();
    const MONTH = (DATE.getMonth() + 1).toString().padStart(2,"0");
    const DAY_MONTH = (DATE.getDate()).toString().padStart(2,"0");
    const HOUR = (DATE.getHours()).toString().padStart(2,"0");
    const MINUTES = (DATE.getMinutes()).toString().padStart(2,"0");
    const SECONDS = (DATE.getSeconds()).toString().padStart(2,"0");

    const TIME_STAMP = `°${YEAR}-${MONTH}-${DAY_MONTH} °${HOUR}:${MINUTES}:${SECONDS}`;

    return TIME_STAMP;

};

module.exports = getDateTime;