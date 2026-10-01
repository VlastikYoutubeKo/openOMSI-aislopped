# This fork

Branch `aislopped` of [VlastikYoutubeKo/openOMSI-aislopped](https://github.com/VlastikYoutubeKo/openOMSI-aislopped):
[openOMSI](https://github.com/openOMSI-Project/openOMSI) with a few changes on top. `main`
stays upstream's; upstream is merged into `aislopped` from time to time.

Every push to `aislopped` is built by the release workflow and published as a release of
this fork. The fork's builds look for updates in the fork's releases.

## What it adds

- **Collisions as in OMSI (ODE)** - a setting, off by default ("Collisions bounce and
  slide as in OMSI (ODE)", `collision_ode`, or `--physics ode`). Omsi.exe leaves the body's
  collisions to ODE with one contact surface for everything: four tenths of the closing
  speed come back from 0.1 m/s on, the friction along the obstacle is a force of 7 kN, and
  the body is not moved out of what it is in. Branch `ode-collisions`.
- **Window panes named in other languages** (okna, sklo, szyba, ablak, …) are panes: lights
  behind a Czech bus's glass show through it.
- **A radio's own text display shows the station and the song** that the internet radio
  plays (Dmitrij's "Magnitola" of P3ta's SOR buses and its kin, and scripts that read
  `Snd_Radio_Text`).
- **Raised height profiles far past what a spline draws** no longer lift a bus's wheels.
- **Launcher:** the start time's minutes go one at a time.

How Omsi.exe does these things was read from the binary; the notes are not part of this
repository.
