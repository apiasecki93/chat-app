const generateMessage = (user, text) => {
    return {
        username: user,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, long, lat) => {
    return {
        username,
        url: `https://google.com/maps?q=${long},${lat}`,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}