---
title: Kitty
permalink: /kitty/
---

I want to build a quadruped robot which moves very dynamically like a cat. It should not be too chunky or heavy.

## Goals

It should be able to

| Goal                        | Done?                                       |
|-----------------------------|--------------------------------------------------|
| Walk            | ❌ |
| Run          | ❌ |
| Jump up on / down from a chair or table        | ❌ |
| Run up / down (irregular) stairs       | ❌ |
| Get up after falling          | ❌ |
| Use machine learning to learn how to move fast and efficient          | ❌ |
| Create a 3D model of the area around it          | ❌ |
| Follow a person          | ❌ |
| Walk around or jump over obstacles         | ❌ |
| Respond to spoken commands          | ❌ |
| Forward commands to Alexa          | ❌ |
| Answer with spoken sentences          | ❌ |
| Connect to a LLM          | ❌ |
| Find a power plug and recharge itself          | ❌ |

## References

Several others already implemented robots which could do some of my goals.

### MIT Mini Cheetah

The [Mini Cheetah](https://news.mit.edu/2019/mit-mini-cheetah-first-four-legged-robot-to-backflip-0304) was released in 2019 and seems to fulfil all the requirements regarding dynamic movement.

{% include video id="G6fMV1UPzkg" provider="youtube" %}

The original software is [open source](https://github.com/mit-biomimetics/Cheetah-Software/blob/master/README.md) (MIT) but it is from 2019 and back then they coded every movement manually. In 2022 they changed that to use machine learning. The Cheetah got much faster and could adjust better to uneven terrain.

{% include video id="-BqNl3AtPVw" provider="youtube" %}

The Mini Cheetah was designed by [Ben Katz](https://build-its.blogspot.com/2019/12/the-mini-cheetah-robot.html). Apparently the actuators were standard motors taken from remote airplanes and drones built into a 6:1 planetary gearbox. This was much cheaper than the custom built actuators which they used before in the Cheetah 3.

The best description should be in his [masters thesis from 2018](https://dspace.mit.edu/handle/1721.1/118671). But one actuator still costs around $300. That's quite a lot if you need 12 of them (3 per leg).

So [Caden Kraft](https://cadenkraft.com/ironless-cycloidal-planetary-actuator/) and [Nachum Twersky](https://www.reddit.com/r/robotics/comments/1i00orx/3d_printed_mit_mini_cheetah_actuator/) tried to cut the costs and 3D printed the gearboxes themselves. They got it down to about $80. But they also wound the coils for their motors themselves and this seems a little too much for me.

### PuppyPi

HiWonder sells not one but two quadruped robots. The [PuppyPi](https://www.hiwonder.com/products/puppypi) based on a Raspberry Pi and the [MechDog](https://www.hiwonder.com/products/mechdog) which is powered by an ESP32-S3.

They both fulfil some of my requirements but cannot move as dynamically as the Mini Cheetah. They have only 8 degrees of freedom (DOF). As of summer 2025 they added voice control.

{% include video id="3ab-o7AZ4wE" provider="youtube" %}

They outsourced voice interaction to their own hardware - the WonderEcho. But I couldn't find any more information how it works exactly.

The [docs](https://docs.hiwonder.com/projects/PuppyPi/en/latest/) look quite good on first sight.

### Other interesting quadrupeds / actuators:

- [Mini Cheetah Clone Teardown by Ben Katz, 2022](https://build-its-inprogress.blogspot.com/2022/11/mini-cheetah-clone-teardown.html)
- [Design of a High Torque Density Modular Actuator for Dynamic Robots by Alexander Hattori, 2020](https://dspace.mit.edu/handle/1721.1/127165)
- [Low Cost Large 3D printed Quadruped by Nachum Twersky aka. Nachos-printer](https://www.reddit.com/r/BambuLab/comments/1cqfcf2/low_cost_large_3d_printed_quadruped/)
- [The Dingo | A Low Cost, Open-Source Robot Quadruped by Alexander Calvert and Nathan Ferguson](https://youtu.be/8KntOIgzUjY?si=zr1fESBo0SI49hOZ)
- [CARA by Aaed Musa](https://www.aaedmusa.com/projects/cara)
- [Amazon: FREENOVE Robot Dog Kit for Raspberry Pi](https://www.amazon.de/FREENOVE-Raspberry-Balancing-Recognition-Ultrasonic/dp/B08C254F73)

There are also many videos on YouTube about Mini Cheetah Actuators and also readily buyable ones at AliBaba, AliExpress, ...

### Speak to your robot

All the quadrupeds from above are controlled via computer or remote control. Nobody just tells them what to do. Well, I want to talk with it.

NetworkChuck did a great video of how to create your own voice assistant without sending all the audio data to the cloud.

{% include video id="XvbVePuP7NY" provider="youtube" %}

He uses a Raspberry Pi with mics and speakers. He already has [Home Assistant](https://www.home-assistant.io/installation/) installed in his home and the [Rhasspi project](https://github.com/rhasspy/wyoming-satellite) integrates nicely with that. He also uses a local notebook for Speech to Text (STT) and Text to Speech (TTS) because his Pi is a bit slow with that.

I want my robot to be as independent as possible. So I don't want to use another local machine with a Home Assistant server or an AI server for STT and TTS. But maybe I can use the other services which Rhasspi uses in the back.

- Keyword recognition: [openWakeWord](https://github.com/rhasspy/openWakeWord-cpp), [microwakeword](https://github.com/kahrendt/microWakeWord/)
- STT: [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper), [Vosk](https://alphacephei.com/vosk/)
- Intent Recognition: Assist
- LLM: llama3.2
- TTS: [Piper](https://github.com/rhasspy/piper), [ElevenLabs (the best, but paid)](https://elevenlabs.io/text-to-speech)

A beefier Pi (Pi 5 with 16GB) with an [AI HAT+](https://www.raspberrypi.com/products/ai-hat/) should also speed up the AI stuff.

### Image recognition

There are some 3D cameras for the Raspberry Pi. Lets test them and see if I can create a 3D model of the robots vicinity with those.

- [ArduCam Time of Flight Camera](https://blog.arducam.com/time-of-flight-camera-raspberry-pi/)
- [Hellbender Stereo Camera](https://hellbender.com/product/stereo-camera/)
- or just take two cheap cameras and do it myself
