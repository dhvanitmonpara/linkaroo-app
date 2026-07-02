const collectionOwnerVerification = (list, user, res) => {
    if ((typeof list == 'object' ? list.valueOf() : list) !== (typeof user == "object" ? user.valueOf() : user)) {
        return res
            .status(403)
            .json(new ApiResponse(
                403,
                "You are not a owner of this list"
            ))
    }
}

export default collectionOwnerVerification