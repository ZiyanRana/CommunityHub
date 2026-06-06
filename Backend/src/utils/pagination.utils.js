const paginationValues = (query) => {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(30, query.limit || 10);
    const skip = ( page - 1 ) * limit;

    return { page, limit, skip };
}

export default paginationValues;