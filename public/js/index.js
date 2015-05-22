let $ = require('jquery')
let io = require('socket.io-client')
// let socket = io('http://127.0.0.1:8000')
let socket = io()
socket.on('connect', ()=>console.log('connected'))
// Enable the form now that our code has loaded
$('#send').removeAttr('disabled')

// Emit a starter message and log it when the server echoes back
socket.on('im', msg => console.log(msg))

let $template = $('#template')

socket.on('im', ({username, msg}) => {
	console.log(username)
    let $li = $template.clone().show()
    $li.children('span').text(username+": " +msg)
    $('#messages').append($li)
})

$('form').submit(() => {
    socket.emit('im', $('#m').val())
    $('#m').val('')
    return false
})
