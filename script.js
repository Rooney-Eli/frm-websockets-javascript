window.onload = () => {

    const blobSocket = new WebSocket('ws://192.168.0.32:8080/binSocket')
    blobSocket.binaryType = "blob"

    const textSocket = new WebSocket('ws://192.168.0.32:8080/textSocket')

    let tsConnected = false
    let bsConnected = false

    const sendText = document.getElementById("send-text")
    const receivedText = document.getElementById("log")

    const generatedImageCanvas = document.getElementById('image-canvas')

    const RED = '#FF0000'
    const GREEN = '#00FF00'
    const BLUE = '#0000FF'
    const BLACK = '#000000'
    const WHITE = '#FFFFFF'

    generateColorImage('grey')
    generateNoiseImage()

    document.getElementById("red-btn").addEventListener('click', () => {
        generateColorImage(RED)
        handleImageSend(generatedImageCanvas)
    })
    document.getElementById("green-btn").addEventListener('click', () => {
        generateColorImage(GREEN)
        handleImageSend(generatedImageCanvas)
    })
    document.getElementById("blue-btn").addEventListener('click', () => {
        generateColorImage(BLUE)
        handleImageSend(generatedImageCanvas)
    })
    document.getElementById("black-btn").addEventListener('click', () => {
        generateColorImage(BLACK)
        handleImageSend(generatedImageCanvas)
    })
    document.getElementById("white-btn").addEventListener('click', () => {
        generateColorImage(WHITE)
        handleImageSend(generatedImageCanvas)
    })

    document.getElementById("noise-btn").addEventListener('click', () => {
        generateNoiseImage()
        handleImageSend(generatedImageCanvas)
    })


    textSocket.onopen = () => {
        tsConnected = true
        console.log('TextSocket open!')
    }

    textSocket.onmessage = (e) => {
        console.log(`TextSocket received: ${e.data}`)
        const item = document.createElement("div")
        item.innerText = e.data
        receivedText.appendChild(item)
    }

    textSocket.onclose = (e) => {
        tsConnected = false
        console.log(`TextSocket closed: ${e.code}`)
    }


    blobSocket.onopen = () => {
        bsConnected = true
        console.log("BlobSocket open!")
    }

    blobSocket.onclose = (e) => {
        bsConnected = false
        console.log(`BlobSocket closed: ${e.message}`)
    }

    blobSocket.onmessage = (e) => {
        const message = e.data
        if (message instanceof Blob) {
            console.log(`BlobSocket received: ${message}`)
            const url = URL.createObjectURL(message)
            const receivedImage = document.getElementById('received-image')
            receivedImage.src = url
            receivedImage.onload = () => {
                URL.revokeObjectURL(url)
            }
        } else {
            console.log(`Strange message received: ${message}`)
        }
    }

    document.getElementById("form").onsubmit = () => {
        if (!tsConnected) {
            console.log("[ERROR] Attempted to send on a closed text socket")
            return false
        }
        if (!sendText.value) {
            console.log("[WARN] Attempted to send an empty text message!")
            return false
        }

        console.log(`TextSocket sending: ${sendText.value}`)
        textSocket.send(sendText.value)
        sendText.value = ""
        return false
    }


    function handleImageSend(canvas) {
        getCanvasBlobAsync(canvas).then((blob) => {
            sendImage(blob)
        }).catch((err) => {
            console.log(`[ERROR] Problem getting solid color blob: ${err}`)
        })
    }

    async function getCanvasBlobAsync(canvas) {
        return await getCanvasPromiseWrapper(canvas)
    }

    function getCanvasPromiseWrapper(canvas) {
        return new Promise((resolve, reject) => {
            getCanvasBlob(
                canvas,
                (successResponse) => {
                    resolve(successResponse)
                },
                (errorResponse) => {
                    reject(errorResponse)
                }
            )
        })
    }

    function getCanvasBlob(canvas, successCallback, errorCallback) {
        return canvas.toBlob((blob) => {
            if (blob != null) {
                return successCallback(blob)
            } else {
                return errorCallback("Blobbing Failed!")
            }
        })
    }


    function sendImage(blob) {
        if (!bsConnected) {
            console.log("[ERROR] Attempted to send on a closed binary socket!")
            return
        }
        setSendingImagePreview(URL.createObjectURL(blob))
        blobSocket.send(blob)
    }

    function setSendingImagePreview(url) {
        const sendingImage = document.getElementById('sending-image')
        sendingImage.src = url
        sendingImage.onload = () => {
            URL.revokeObjectURL(url)
        }
    }


    function generateColorImage(color) {
        const canvas = document.getElementById('image-canvas')
        canvas.height = 100
        canvas.width = 100
        const ctx = canvas.getContext("2d")
        ctx.fillStyle = color
        ctx.fillRect(0, 0, canvas.width, canvas.height)

    }

    function generateNoiseImage() {
        const canvas = document.getElementById('image-canvas')
        const w = canvas.height = 100
        const h = canvas.width = 100
        const ctx = canvas.getContext("2d")

        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const num = Math.floor(Math.random() * 255)
                ctx.fillStyle = "rgb(" + num + "," + num + "," + num + ")"
                ctx.fillRect(i, j, 1, 1)
            }
        }
    }
}
