let downCanvas
let upCanvas
let sumCanvas
let graphCanvas

const c = 75 //speed of light (nm/s)

// in nm
let wavelength = 550
let filmThickness = 500

let iorFilm = 1.1
let iorAbove = 1
let iorBelow = 1.5

document.getElementById("wavelengthInput").addEventListener("input", function (e) {
    wavelength = parseFloat(e.target.value)
})
document.getElementById("thicknessInput").addEventListener("input", function (e) {
    filmThickness = parseFloat(e.target.value)
})
document.getElementById("ior1Input").addEventListener("input", function (e) {
    iorFilm = parseFloat(e.target.value)
})
document.getElementById("ior2Input").addEventListener("input", function (e) {
    iorBelow = parseFloat(e.target.value)
})
document.getElementById("ior3Input").addEventListener("input", function (e) {
    iorAbove = parseFloat(e.target.value)
})

function setup() {
    document.getElementById("defaultCanvas0").remove()

    downCanvas = createGraphics(400, 600)
    upCanvas = createGraphics(400, 600)
    sumCanvas = createGraphics(400, 600)

    graphCanvas = createGraphics(800, 400)

    const downCanvasHolder = document.getElementById("downCanvasHolder")
    const downCanvasTitle = document.createElement("p")
    downCanvasTitle.innerText = "Wave traveling down through the film"
    downCanvasHolder.append(downCanvasTitle)
    downCanvasHolder.append(downCanvas.elt)

    const upCanvasHolder = document.getElementById("upCanvasHolder")
    const upCanvasTitle = document.createElement("p")
    upCanvasTitle.innerText = "Wave's reflections back out of the film"
    upCanvasHolder.append(upCanvasTitle)
    upCanvasHolder.append(upCanvas.elt)

    const sumCanvasHolder = document.getElementById("sumCanvasHolder")
    const sumCanvasTitle = document.createElement("p")
    sumCanvasTitle.innerText = "Sum of the reflected waves: what we see"
    sumCanvasHolder.append(sumCanvasTitle)
    sumCanvasHolder.append(sumCanvas.elt)

    document.getElementById("graphHolder").append(graphCanvas.elt)
}

let t = 0
function draw() {
    const waveColor = wavelengthToRGB(wavelength)

    downCanvas.noStroke(); downCanvas.strokeWeight(1)
    upCanvas.noStroke(); upCanvas.strokeWeight(1)
    sumCanvas.noStroke(); sumCanvas.strokeWeight(1)

    for (let i = 0; i < 3; i++) { drawBG([downCanvas, upCanvas, sumCanvas][i], filmThickness, iorFilm, iorBelow, iorAbove) }

    const firstBoundaryPos = downCanvas.height - 40 - nmToPix(filmThickness)
    const secondBoundaryPos = downCanvas.height - 40

    const topWaveStartTime = firstBoundaryPos / nmToPix(c / iorAbove)
    const bottomWaveStartTime = topWaveStartTime + (secondBoundaryPos - firstBoundaryPos) / nmToPix(c / iorFilm)

    const topWavePhaseOffset = iorAbove < iorFilm ? Math.PI : 0
    const bottomWavePhaseOffset = iorFilm < iorBelow ? Math.PI : 0

    downCanvas.stroke(waveColor.r, waveColor.g, waveColor.b); downCanvas.strokeWeight(4)
    drawWave(downCanvas, 0, 1, 20, 0, t, 0, wavelength, 0)

    if (iorFilm !== iorAbove) {
        upCanvas.stroke(waveColor.r, waveColor.g, waveColor.b); upCanvas.strokeWeight(4)
        drawWave(
            upCanvas,
            firstBoundaryPos,
            -1, 20, 0,
            t,
            topWaveStartTime,
            wavelength,
            topWavePhaseOffset
        )

        drawWaveFade(
            downCanvas,
            firstBoundaryPos,
            -1, 20, 0,
            t,
            topWaveStartTime,
            wavelength,
            topWavePhaseOffset
        )
    }

    if (iorFilm !== iorBelow) {
        upCanvas.stroke(waveColor.r, waveColor.g, waveColor.b, 150); upCanvas.strokeWeight(4)
        drawWave(
            upCanvas,
            secondBoundaryPos,
            -1, 20, 10,
            t,
            bottomWaveStartTime,
            wavelength,
            bottomWavePhaseOffset
        )

        drawWaveFade(
            downCanvas,
            secondBoundaryPos,
            -1, 20, 10,
            t,
            bottomWaveStartTime,
            wavelength,
            bottomWavePhaseOffset
        )
    }

    if (iorFilm !== iorAbove && iorFilm !== iorBelow) {
        sumCanvas.stroke(waveColor.r, waveColor.g, waveColor.b); sumCanvas.strokeWeight(4)
        drawSumWave(
            sumCanvas,
            firstBoundaryPos,
            secondBoundaryPos,
            20, -5,
            t,
            topWaveStartTime,
            bottomWaveStartTime,
            topWavePhaseOffset,
            bottomWavePhaseOffset
        )
    }

    drawGraph(wavelength, filmThickness, iorAbove, iorFilm, iorBelow)

    const filmColor = getFilmColor(filmThickness, iorAbove, iorFilm, iorBelow)
    document.getElementById("colorDisplay").style = `width:100px; height:100px; background-color: rgba(${filmColor.r}, ${filmColor.g}, ${filmColor.b}, 255); display:block;`

    t += deltaTime / 1000
}

function getIor(pos) {
    const firstBoundaryPos = downCanvas.height - 40 - nmToPix(filmThickness)
    const secondBoundaryPos = downCanvas.height - 40

    if (pos <= firstBoundaryPos) {
        return iorAbove
    } else if (pos <= secondBoundaryPos) {
        return iorFilm
    } else {
        return iorBelow
    }
}

// startPos in pix, distance in pix
function getTravelDistance(startPos, direction, travelTime) {
    let pos = startPos
    const dt = 0.01
    for (let t = 0; t < travelTime; t += dt) {
        pos += nmToPix(direction * (c / getIor(pos)) * dt)
    }

    return Math.abs(pos - startPos)
}

function drawWave(canvas, sourcePos, direction, spacing, spacingOffset, time, waveStartTime, wavelength, phaseOffset) {
    const frequency = c / wavelength //using frequency is better because it stays constant in different ior

    const end = direction == 1 ? canvas.height : 0
    const t = time - waveStartTime
    if (t < 0) { return }

    sourcePos = direction == 1 ? Math.ceil(sourcePos / spacing) * spacing : Math.floor(sourcePos / spacing) * spacing
    sourcePos += direction * spacingOffset

    let phase = -2 * Math.PI * frequency * t + phaseOffset
    const maxTravelDist = t > 25 ? Math.abs(end - sourcePos) : Math.min(Math.abs(end - sourcePos), getTravelDistance(sourcePos, direction, t))
    for (let i = 0; i <= maxTravelDist; i += spacing) {
        const vectorPos = sourcePos + direction * i

        drawVector(
            canvas,
            createVector(70 * Math.sin(phase), 0),
            createVector(canvas.width / 2, vectorPos),
            15 * Math.abs(Math.sin(phase)), 0.5
        )

        phase += 2 * Math.PI * getIor(vectorPos) / nmToPix(wavelength) * spacing
    }
}

function drawSumWave(canvas, sourcePosTop, sourcePosBottom, spacing, spacingOffset, time, waveStartTimeTop, waveStartTimeBottom, phaseOffsetTop, phaseOffsetBottom) {
    const frequency = c / wavelength

    const end = 0
    const tTop = time - waveStartTimeTop
    const tBottom = time - waveStartTimeBottom

    if (tTop < 0) { return }

    sourcePosTop = Math.floor(sourcePosTop / spacing) * spacing + spacingOffset
    sourcePosBottom = Math.floor(sourcePosBottom / spacing) * spacing + spacingOffset

    let phaseTop = -2 * Math.PI * frequency * tTop + phaseOffsetTop
    let phaseBottom = -2 * Math.PI * frequency * tBottom + phaseOffsetBottom

    const maxTravelDistTop = tTop > 25 ? Math.abs(end - sourcePosTop) : Math.min(Math.abs(end - sourcePosTop), getTravelDistance(sourcePosTop, -1, tTop))
    const maxTravelDistBottom = tTop > 25 ? Math.abs(end - sourcePosBottom) : Math.min(Math.abs(end - sourcePosBottom), getTravelDistance(sourcePosBottom, -1, tBottom))

    // drawing the bottom reflection on its own
    for (let i = 0; i <= Math.min(maxTravelDistBottom, sourcePosBottom - sourcePosTop) - spacing; i += spacing) {
        const vectorPos = sourcePosBottom - i

        drawVector(
            canvas,
            createVector(70 * Math.sin(phaseBottom), 0),
            createVector(canvas.width / 2, vectorPos),
            15 * Math.abs(Math.sin(phaseBottom)), 0.5
        )

        phaseBottom += 2 * Math.PI * getIor(vectorPos) / nmToPix(wavelength) * spacing
    }

    // drawing the top reflection summed with the bottom
    for (let i = 0; i <= maxTravelDistTop; i += spacing) {
        const vectorPos = sourcePosTop - i

        let sum = 0
        if (maxTravelDistBottom > sourcePosBottom - vectorPos) {
            sum = Math.sin(phaseTop) + Math.sin(phaseBottom)
        }
        else {
            sum = Math.sin(phaseTop)
        }

        drawVector(
            canvas,
            createVector(70 * sum, 0),
            createVector(canvas.width / 2, vectorPos),
            15 * Math.abs(sum), 0.5
        )

        phaseTop += 2 * Math.PI * getIor(vectorPos) / nmToPix(wavelength) * spacing
        phaseBottom += 2 * Math.PI * getIor(vectorPos) / nmToPix(wavelength) * spacing
    }
}

function drawWaveFade(canvas, sourcePos, direction, spacing, spacingOffset, time, waveStartTime, wavelength, phaseOffset) {
    const waveColor = wavelengthToRGB(wavelength)

    const frequency = c / wavelength //using frequency is better because it stays constant in different ior

    const t = time - waveStartTime
    if (t < 0) { return }

    sourcePos = direction == 1 ? Math.ceil(sourcePos / spacing) * spacing : Math.floor(sourcePos / spacing) * spacing
    sourcePos += direction * spacingOffset

    let phase = -2 * Math.PI * frequency * t + phaseOffset
    const maxTravelDist = t > 3 ? 100 : Math.min(100, getTravelDistance(sourcePos, direction, t))
    for (let i = 0; i <= maxTravelDist; i += spacing) {
        const vectorPos = sourcePos + direction * i

        canvas.stroke(waveColor.r, waveColor.g, waveColor.b, 100 * (1 - i / 75)); canvas.strokeWeight(4)

        drawVector(
            canvas,
            createVector(70 * Math.sin(phase), 0),
            createVector(canvas.width / 2, vectorPos),
            15 * Math.abs(Math.sin(phase)), 0.5
        )

        phase += 2 * Math.PI * getIor(vectorPos) / nmToPix(wavelength) * spacing
    }
}

function drawBG(canvas, filmThickness, ior, iorUnder, iorAbove) {
    const t = nmToPix(filmThickness)

    canvas.background(15)

    canvas.fill(255, 255, 255, (iorAbove - 1) * 200)
    canvas.rect(0, 0, canvas.width, canvas.height - 40 - t)

    canvas.fill(255, 255, 255, (iorUnder - 1) * 200)
    canvas.rect(0, canvas.height - 40, canvas.width, 40)

    canvas.fill(255, 255, 255, (ior - 1) * 200)
    canvas.rect(0, canvas.height - 40 - t, canvas.width, t)
}

//nm to pixels
function nmToPix(d) {
    return d * 2 / 3
}

function pixToNm(d) {
    return d * 3 / 2
}

function drawVector(canvas, vector, position, headLength, headAngle) {
    canvas.push()
    canvas.translate(position.x, position.y)
    canvas.rotate(vector.heading())
    canvas.line(0, 0, vector.mag(), 0)
    canvas.line(vector.mag(), 0, vector.mag() - headLength * Math.cos(headAngle), headLength * Math.sin(headAngle))
    canvas.line(vector.mag(), 0, vector.mag() - headLength * Math.cos(headAngle), -headLength * Math.sin(headAngle))
    canvas.pop()
}

function getLightIntensity(wavelength, thickness, iorAbove, iorFilm, iorBelow) {
    if (iorFilm == iorAbove || iorFilm == iorBelow) { return 1 }

    const PI = Math.PI

    let phaseOffset = 0
    if (iorBelow > iorFilm) { phaseOffset += PI }
    if (iorFilm > iorAbove) { phaseOffset -= PI }

    return pow(Math.cos(2 * PI * iorFilm * thickness / wavelength + phaseOffset / 2), 2)
}

function drawGraph(wavelength, thickness, iorAbove, iorFilm, iorBelow) {
    graphCanvas.background(15)

    const s = 2
    for (let l = 400; l < 700; l += s) {
        const thisIntensity = getLightIntensity(l, thickness, iorAbove, iorFilm, iorBelow)
        const nextIntensity = getLightIntensity(l + s, thickness, iorAbove, iorFilm, iorBelow)

        const col = wavelengthToRGB(l)
        graphCanvas.stroke(col.r, col.g, col.b)
        graphCanvas.strokeWeight(5)

        graphCanvas.line(
            map(l, 400, 700, 0, graphCanvas.width),
            map(thisIntensity, 0, 1, graphCanvas.height - 20, 20),
            map(l + s, 400, 700, 0, graphCanvas.width),
            map(nextIntensity, 0, 1, graphCanvas.height - 20, 20)
        )
    }

    const col = wavelengthToRGB(wavelength)
    graphCanvas.stroke(col.r, col.g, col.b)
    graphCanvas.ellipse(
        map(wavelength, 400, 700, 0, graphCanvas.width),
        map(getLightIntensity(wavelength, thickness, iorAbove, iorFilm, iorBelow), 0, 1, graphCanvas.height - 20, 20),
        20
    )

    graphCanvas.stroke(255)
    drawVector(graphCanvas, createVector(790, 0), createVector(0, graphCanvas.height-20), 15, 0.6)
    drawVector(graphCanvas, createVector(0, 20 - graphCanvas.height), createVector(20, graphCanvas.height), 15, 0.6)

    graphCanvas.noStroke()
    graphCanvas.fill(255)
    graphCanvas.textSize(30)
    graphCanvas.textFont("Times New Roman")

    graphCanvas.text("I", 40, 40)
    graphCanvas.text("λ", 760, 370)
}

function getFilmColor(thickness, iorAbove, iorFilm, iorBelow) {
    const s = 2
    let totalCol = createVector(0, 0, 0)
    for (let l = 400; l < 700; l += s) {
        const c = wavelengthToRGB(l)
        totalCol.add(createVector(c.r, c.g, c.b).mult(getLightIntensity(l, thickness, iorAbove, iorFilm, iorBelow)).mult(s))
    }
    totalCol.div(150)

    return { r: totalCol.x, g: totalCol.y, b: totalCol.z }
}

function map(val, inMin, inMax, outMin, outMax) {
    return (val - inMin) / (inMax - inMin) * (outMax - outMin) + outMax
}

function wavelengthToHSV(wavelength) {
    const h = 5.6 / 9 * 1e-12 * pow(wavelength, 6) - 78.8 / 3 * 1e-10 * pow(wavelength, 5) + 3917 / 9 * 1e-8 * pow(wavelength, 4) - 11011.1 / 3 * 1e-6 * pow(wavelength, 3) + 15.08846 / 9 * pow(wavelength, 2) - 1191.698 / 3 * wavelength + 38807.3
    const s = 1
    const v = -27.28 / 3 * 1e-12 * pow(wavelength, 6) + 865.16 / 3 * 1e-10 * pow(wavelength, 5) - 11338.7 / 3 * 1e-8 * pow(wavelength, 4) + 0.07862455 / 3 * pow(wavelength, 3) - 10.145934 * pow(wavelength, 2) + 2080.7553 * wavelength - 176712.9

    return { h, s, v: v / 100 }
}

function hsvToRgb(h, s, v) {
    let c = v * s
    let x = c * (1 - Math.abs((h / 60) % 2 - 1))
    let m = v - c
    let r, g, b

    if (h >= 0 && h < 60) {
        r = c, g = x, b = 0
    } else if (h >= 60 && h < 120) {
        r = x, g = c, b = 0
    } else if (h >= 120 && h < 180) {
        r = 0, g = c, b = x
    } else if (h >= 180 && h < 240) {
        r = 0, g = x, b = c
    } else if (h >= 240 && h < 300) {
        r = x, g = 0, b = c
    } else {
        r = c, g = 0, b = x
    }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    }
}

function wavelengthToRGB(wavelength) {
    const hsv = wavelengthToHSV(wavelength)
    return hsvToRgb(hsv.h, hsv.s, hsv.v)
}