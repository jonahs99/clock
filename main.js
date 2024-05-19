const [init_millis, inc_millis] = (() => {
    if (!window.location.hash) return [300_000, 10_000]
    const nums = window.location.hash.slice(1)
        .split('+')
        .map((s) => parseInt(s) * 1000)
        .map((x) => isNaN(x) ? 0 : x)
    if (nums.length < 2) nums.push(0)
    return nums.slice(0, 2)
})()

const low_millis = 20 * 1000
const beep_millis = 11 * 1000

const timers = [
    { time: init_millis },
    { time: init_millis },
]

const button_els = timers.map((_, i) => document.querySelector(`#timer${i}`))
const timer_els = timers.map((_, i) => document.querySelector(`#timer${i} p`))

button_els.forEach((el, i) => {
    el.addEventListener('pointerdown', () => {
        const j = 1 - i
        if (!timers[j].running && timers[i].time > 0) {
            // Stop my clock
            if (timers[i].running) timers[i].time += inc_millis
            delete timers[i].running
            button_els[i].classList.remove('running')

            // Start their clock
            timers[j].running = Date.now() + timers[1 - i].time
            button_els[j].classList.add('running')

            beep(300)
        }

        if (!document.fullscreenElement) document.body.requestFullscreen()
    })
})

function loop(t) {
    timers.forEach((timer, i) => {
        let oldTime = timer.time
        if (timer.running) {
            timer.time = Math.max(timer.running - Date.now(), 0)
        }
        timer_els[i].innerText = formatTime(timer.time)

        if (timer.time < low_millis) {
            if (!button_els[i].classList.contains('low')) {
                button_els[i].classList.add('low')
                beep(600)
            }
        } else {
            button_els[i].classList.remove('low')
        }

        if (timer.time < beep_millis) {
            if (Math.floor(timer.time / 1000) === Math.floor(oldTime / 1000) - 1) beep(600, 0.2)
            else if (Math.floor((timer.time - 500) / 1000) === Math.floor((oldTime - 500) / 1000) - 1) beep(400, 0.4)
        }
    })

    requestAnimationFrame(loop)
}
requestAnimationFrame(loop)

function formatTime(t) {
    let r = t
    const m = Math.floor(r / 60000)
    r -= m * 60000
    const s = Math.floor(r / 1000)
    r -= s * 1000
    const d = Math.floor(r / 1000 * 10)

    if (m > 0) {
        return `${m.toString()}:${s.toString().padStart(2, '0')}`
    } else if (s >= 10) {
        return `${s.toString().padStart(2, '0')}`
    } else if (t > 0) {
        return `${s.toString().padStart(2, '0')}.${d.toString()}`
    } else {
        return '⚑'
    }
}

const aud = new AudioContext()

function beep(f, g = 1) {
    const osc = aud.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f

    const gain = aud.createGain()
    osc.connect(gain).connect(aud.destination)

    gain.gain.setValueAtTime(g, aud.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, aud.currentTime + 0.2) 

    osc.start(aud.currentTime)
    osc.stop(aud.currentTime + 1)
}

