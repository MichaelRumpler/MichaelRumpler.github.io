---
title: Reiseblog
permalink: /reiseblog/
header:
  image: /assets/images/world.png
---

Hier findet ihr Berichte über einige unserer großen Reisen.

## Aktuell

{% include journey-single.html title="Kuba" image="kuba" date="2024" %}

## Frühere

{% include journey-single.html title="Costa Rica" image="costarica" date="2018" %}
{% include journey-single.html title="Laos" image="laos" date="2015" %}
{% include journey-single.html title="Neuseeland, Australien, Thailand" image="nz-au-th" date="2011" %}
{% include journey-single.html title="Rogen-Röa-Femund" image="rogen" date="2011" %}

{% assign entries_layout = page.entries_layout | default: 'list' %}

{% include category-with-posts.html category="Kuba" title="Kuba" %}
{% include category-with-posts.html category="Costa Rica" title="Costa Rica" %}
{% include category-with-posts.html category="Laos" title="Laos" %}
{% include category-with-posts.html category="NZ-AU-TH" title="Neuseeland, Australien, Thailand" %}
{% include category-with-posts.html category="Rogen" title="Rogen-Röa-Femund" %}
