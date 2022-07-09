//use io() to create a new socket connection
const socket = io()

//exeps 2 arguments ( event, callback )
    // socket.on('countUpdated', (count) => {
    //     console.log(`Count has been updated: ${count}`)
    // })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('clicked')
//     //emit an event called increment
//     socket.emit('increment')
// })

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true }) //question markt will go away with ignoreQueryPrefix: true


const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // console.log(newMessageStyles)


    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight


    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('DD.MM.YYYY h:mm:ss a')
    })
    // console.log(message)
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('locationMessage', (message) => {
    // console.log(message)

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        locationUrl: message.url,
        createdAt: moment(message.createdAt).format('DD.MM.YYYY h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

//read value from submit button
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    
    socket.emit('sendMessage', message,  (error) => {

        // enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus() // focus on the input again

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered')
    })
    
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    }

    function error(err) {
        console.log(err)
        alert('Unable to get location')
        $sendLocationButton.removeAttribute('disabled')
    }

    if (navigator.geolocation) {
        // pass option for high accuracy for navigator.geolocation.getCurrentPosition()
        navigator.geolocation.getCurrentPosition((position) => {
            // console.log(position)
            socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, (statusServer) => {
                console.log('Location shared', statusServer)
            })
        }, error, options)
        $sendLocationButton.removeAttribute('disabled')
    }
})



   

//sending surname and room data to server
socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
   