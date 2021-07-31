# Motivation

When teaching PLC-programming to students, normally my students use a PLC connected to a hardware-model consisting of two barriers. This is ok for teaching small groups of students, but for a larger group there are not enough hardware-models.

This electron-app is a virtual barrier-model, that simulates the real hardware-model. Instead of using PLC-inputs/outputs it is "connected" via modbus-tcp to a SOFT-PLC. CoDeSys and Beremiz can be used for PLC-Programming, since they support modbus.

To get an idea, how this app looks like, just have a look at `virtualModel.svg`.

# Connecting to the virtual barrier model

This app contains a modbus-server, the soft-PLC must implement a modbus-client.

For further details refer to `Doku_zur_Programmentwicklung.md` (german).

Instead of a PLC-Program the Modbus-Client from `Modbus_Client_for_Testing/modbus_client.py` can be used for testing-purposes.


# Installing

With node.js installed, this program can be installed and run using the following commands:

```
git clone https://github.com/lzukw/virtual_barrier_model.git
cd virtual_barrier_model
yarn install
yarn start
```

# Deploying

Edit `package.json` and remove not uses makers in the section "config" > "forge" > makers. For example on a Fedora-System remove `"@electron-forge/maker-deb"`.

Then run `yarn run make` and find the build-results in the `out`-directory.
