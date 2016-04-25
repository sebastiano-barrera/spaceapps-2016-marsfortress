function deleteFromArray (array, element) {
    return $.grep(array, function(v, k) {
        console.log(v !== element);
        return v !== element;
    });
}
