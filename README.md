# What is this?

An ugly solution to an ugly problem! In the JS world, everybody and their aunt
cooks their own soup when things get dressed (AKA when things get packaged).

It seems very complicated to adapt a nix build for each of these tools while
complying with the pureness required by nix. So, we figured the following:

Why don't we just ship the pregenerated `dist` folders of each of these tools,
and use nix only to create a nwjs launcher for them? Yeah, that's what we did.

# How to use it?

First, make sure you can use nix flakes. Than for starters, we recommend, that
you add this repo to your registry:

```bash
nix registry add drone-tools github:aeronautical-informatics/drone-tools
```

Now discover the available tools:

```bash
nix flake show drone-tools
```

To run one of them, you can use `nix run`:

```bash
nix run drone-tools#blackbox-log-viewer
```

And to permanently install them to your users profile, run something like this

```bash
nix profile install drone-tools#inav-configurator
```
