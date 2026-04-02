const efficient = (function () {
    const bigArray = new Array(10000).fill("X"); // created once

    return function (index) {
        return bigArray[index];
    };
})();

console.log(efficient(658));
console.log(efficient(1200));
console.log(efficient(2000));
