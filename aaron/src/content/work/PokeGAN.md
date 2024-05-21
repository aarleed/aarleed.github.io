---
title: PokeGAN
publishDate: 2020-07-04 00:00:00
img: /assets/CNNResult.png
img_alt: Generated Pokemon CNN picture
description: |
  Pokemon with GANs! (made in 2020) ... before Diffusion Models
tags:
  - Generative AI
  - Python
  - Tensorflow/Keras
  - Data Preprocessing
---

## Motivation
I like Pokemon and I like AI... can I try to create Pokemon using AI? Let's use GANs (2020 before diffusion models popularity)

## Implementation
Data Augmentation is first needed due to limitations in the dataset (few images): this involved re-coloring images. ie. making Pikachu be blue, red in addition to its colors.

The state of the art around the time still revolved around Generative Adversarial Networks, so this was the main approach used to tackle this problem, specifically using DCGANS (Deep Convolutional Generative Adversarial Networks) the adversarial framework with Convolutional Neural Networks. I also decided to see the results without using Convolutions and the result is below too, but the colors are much more disconnected (due to the prediction of one pixel location not having much impact on another which is addressed in CNNs). However, interestingly, the shapes of fake Pokemon appear to roughly better than the CNNs

Roughly how it works is as follows:
<img src="/assets/GANArchitecture.jpg" />
How to train generator:
<img src="/assets/PokeGanTrain1.png" />
How to train discriminator:
<img src="/assets/PokeGan.png" />

1. We have two main training loops, first we train a generator to try and fool the discriminator by attempting to produce images that the discriminator thinks is "real" and then we train a discriminator model to distinguish between real and fake Pokemon images updating the weights of both along the way.
2. For the training the generator, we start with some random noise and train it to generate images, setting the discriminator to have static weights and then treating the images as "real" (binary cross entropy) and updating the weights with the difference between the predicted score (ŷ) and the real score (y). We set the "real score" to be 1 to force the generator to create realistic images.
3. We then train the discriminator to distinguish between real images and fake images, updating the weights. We use a "real" score of 0.9 because it empirically has better results.

For both networks we use binary cross entropy loss.


## Results
Wow some colorful blobs! I thought this was pretty cool at the time, but now diffusion models can produce a much higher quality result as demonstrated by DallE2.

GANs were the most popular architecture up until ~2020 (which is when I created this!) and Diffusion models started gaining popularity around this time. GANs do a pretty good job with Pokemon generation, I can see Pokemon shapes in some of the outputs, but often there are a lot of failures in the outputs (they just look like blobs).

Future work could definitely involve using the diffusion model architecture, training for longer with more compute, and using a more complex model architecture. I was limited by Kaggle's resources which forced me to use a relatively simple model architecture.

Images with CNNS:
<img src="/assets/CNNResult.png" alt="Images with CNNs"/>
Images without CNNS:
<img src="/assets/NoCNNResult.png" alt="Images without CNNS" />