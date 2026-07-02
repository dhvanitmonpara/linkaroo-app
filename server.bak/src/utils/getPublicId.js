const getPublicId = (rawId) => {
    const queryArray = rawId.split('/');
    const idWithExtension = queryArray[queryArray.length - 1];
    const publicId = idWithExtension.split('.')[0];

    return publicId;
}

export default getPublicId;