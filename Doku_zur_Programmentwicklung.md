# Virtuelles Schrankenmodell

## Benutzung des fertigen Programms
Mit einem von Schüler:innen zu entwickelnden SPS-Programm, das anstelle digitaler Ein-/Ausgänge einen modbus-client benutzt, kann das virtuelle Schrankenmodell gesteuert werden. Das virtuelle Schrankenmodell beinhaltet einen modbus-Server. Der modbus-client kann coils im modbus-Server setzen (das entspricht dem Setzen von digitalen SPS-Ausgängen, die dann ein reales Modell ansteuern). Der modbus-Client kann die Zusände der discrete-inputs des modbus-Servers lesen. (Das entspricht dem Einlesen digitaler SPS-Eingänge bei einem realen Modell).

Das ferige Programm startet in einem von Elektron gestarteten Fenster (Browser-Window) und zeigt das virtuelle Schrankenmodell als (veränderbare) svg-Zeichnung an. In dieser Zeichnung sind auch die Zustände der verwendeten Modbus-coils (SPS-Ausgänge) und der discrete-inputs (SPS-Eingänge) mittels "LEDs" sichtbar. Die mit einem realen Modell durchführbaren Voränge werden im virutellen Schrankenmodell mit Buttons und Slidern realisiert:

- Button "Put Car" (sowohl für die Einfahrt/entrance, als auch für die Ausfahrt/exit vorhanden). Stellt ein Auto vor den jeweiligen Schranken. 
TODO weitere Buttons, Checkboxes und Slider erklären.

Weitere visuelle Rückmeldungen:

- Wenn bei einem Schranken das Motorsignal nicht abgeschaltet ist, obwohl der Schranken bereits seine Endlage erreicht hat, sieht der Benutzer eine Rauchwolke. Diese hat aber keine Auswirkung auf die weitere Funktion des Modells. Sie verschwindet wieder, sobald der Schranken wieder ordungsgemäß bewegt wird. Die Rauchwolke kommt auch, wenn gleichzeitig das Motor-open und das Motor-close-Signal aktiviert werden.

- Wenn ein Auto mit dem Slider unter einen nicht vollständig geöffneten Schranken geschoben wird, so sieht der Benutzer ein "crash"-Symbol. Auch dieses hat keine Auswirkung auf die weitere Funktion des Schrankenmodells.

Anstelle des SPS-Programms, kann auch das im Ornder `Modbus_Client_for_Testing` vorhandene python-Programm verwendet werden. Mit diesme Programm können die Coils Nr. 0..31 gesetzt werden, und der Zustand der discrete-inpits Nr. 0..31 wird ständig eingelesen.

## Grundlegende Komponenten 

Typische Electron-App:

- `main.js` ist das Standard-Template aus dem  Electron-"Erste Schritte"-App und kontrolliert die App (ein BrowserWindow wird erzeugt und angezeigt. Wenn es geschlossen wird, beendet sich die App. Es werden nur ganz wenige Zeilen in das Standard-Template eingefügt.

- `preload.js` enthält den Modbus-Server (npm-package `modbus-serial`) und stellt der im Browserwindow laufenden Client-App Funktionalität zum Ändern der discrete-inputs und Input-Register und zum Lesen der Coils und Holding-Register zur Verfügung. Dadurch hat die Client-App (das eigentliche virtuelle Schrankenmodell) die gleiche Information über die vier Modbus-Tables (coils, discrete-inputs, input-register und holding-register), wie der modubus-Server und der den modbus-Server ständig pollende modbus-client.

- Client-App bestehend aus `index.html`, `virtualModel.svg` `virtualModel.js`. Dabei hat `virtualModel.js` Zugang zu den vier von `preload.js` zur Verfügung gestellten Funktionen `modbus.getCoil(addr)`, `modbus.getHoldingRegister(addr)`, `modbus.setDiscreteInput(addr, value)`, `modbus.setInputRegister(addr, value)`. Diese vier Funktionen sind die Schnittstelle zwischen Client-App und unter node.js laufenden Modbus-Server.

### Modbus-Server - preload.js

Dieser wird von der SPS-Runtime (z.B. Beremiz oder CoDeSys) konsultiert. Das von den Schüler*innen im Projektunterricht zu erstellende SPS-Programm läuft nicht auf einer SPS, die mittels digitaler Ein- und Ausgänge mit einem Hardware-Schrankenmodell verbunden ist. Sondern die SPS-Runtime (Soft-SPS von Beremiz oder CoDeSys) hat einen Modbus-Client. Von der SPS gesetzte digitale Ausgänge werden in Modbus-Write-Coil-Aufrufe übersetzt und das Lesen von digitalen Eingägen erfolgt tatsächlich durch zyklische Modbus-Read-discrete-Input-Aufrufe.

In diesem Projekt (virutelles Anlagen-Modell) lauscht der Modbus-Server auf die Modbus-Client-Anfragen und beantwortet diese.

Es wird das fertige npm-package `modbus-serial` verwendet.

### Client-Anwendung

Läuft von Electron gestarteten "BrowserWindow". 

Die Client-Anwendung im Browser kennt den genauen Zustand der digitalen "Eingänge" (discrete-inputs). Sie weiß z.B., ob ein Schranken offen ist, und ob daher der Endschalter - ein "digitaler Eingang" bzw. ein discrete Input am Modbus-Server - betätigt ist. Achtung: Aus Sicht des Modells sind die discrete-inputs Ausgänge, die an "Eingänge" der SPS angeschlossen werden.

Die Webbrowser laufende Client-Anwendung holt sich zyklisch die Zustände der "SPS-Ausgänge", also der am Modbus-Server gespeicherten coils (z.B: Motor-Signale, die den virtuellen Schranken bewegen), und liefert die Zustände der "SPS-Eingänge", also der am Modbus-Server gepspeicherten discrete-Inputs (z.B. Endschalter).

# Projekt-Erstellung

Im folgenden sind die hintereinander durchgeführten Schritte ersichtlich. Ziel ist immer, so viel wie möglich bestehenden Code zu verwenden, und nur wenig selbst zu schreiben.

## Initialisierung

Zuerst wurde auf github.com/lzukw ein neues Repository erstellt mit einem .gitignore (Node) und der MIT-Lizenz. Dieses wurde geklont --> Ornder `virtual_barrier_model`. In diesen wechseln.

```
touch main.js
yarn init
yarn add modbus-serial
yarn add --dev @electron-forge/cli
yarn electron-forge import
```

Bei `yarn init` wurden folgene Angaben gemacht, bei allen anderen Fragen wurden die Default-Werte gelassen:
- description: Virtual Barrier Model used for teaching PLC-programming
- Entry point: main.js

npm-Paket modbus-server installiert auch eine Menge an Abhängigkeiten (siehe Ordner node-modules, bzw. Datei yarn.lock, oder shell-Kommando `yarn list`)

Nun kann die App mit `yarn start` im Terminal gestartet werden (macht aber noch nichts).

Debugging mit VSCode: Launch-Konfiguration hinzufügen: Menü Run >> Add Configuration >> Node.js. Dann in der Datei .vscode/launch.json den Button "Add Configuration" >> "Node.js: Electron Main". Man kann nun die alte Launch-Configuration (mit "name": "Launch Program") löschen. Danach startet bei F5 jedes Mal die Electron-App. Allerdings kann man nur main.js debuggen, was nicht allzu viel bringt. `preload.js` und die Client-App können nur mit den Dev-Tools des BrowserWindow gedebuggt werden. Dadurch wird die App aber nicht als electron-forge-App, sondern als normale electron-App gestartet.

## main.js

Es wird das Standard-Template aus der "Erste-Schritte-Doku" bzw. aus Electron-Fiddle verwendet. Folgende Zeilen wurden eingefügt:

- `mainWindow.removeMenu();` ...Entfernt den menu-bar des Fensters. Während der Entwicklung wird diese Zeile noch auskommentiert, da man ohne menu-bar auch nicht die Dev-Tools zum Debuggen öffnen kann.

## Modbus-Server - preload.js

Die vier Modbus-Tabllen, die ein Modbus-Server intern speichert, werden in der Datei `preload.js` in einem globalen Objekt `modbusTables` gespeichert. Es gibt Tabellen für Discrete Inputs, Coils, Input Registers und Holding Registers. Alle Tabellen haben standardmäßig 32 Einträge. Dieser Wert ist über die Umgebungsvariable `MODBUS_TABLE_LENGTH` konfigurierbar. Es sollten aber eigentlich für realistische Schüler:innen-Projekte 32 Einträge mehr als genung sein.

Der Modbus-Server lauscht auf den Port, der in der Umgebungsvariablen `MODBUS_PORT` beim Start von node gespeichert ist. Gibt es diese Umgebungsvariable nicht, so wird standardmäßig Port 1502 verwendet (Der genormte Port 502 würde Administrator-Rechte erfordern).

Der weitere Code für den Modbus-Server stammt vom [Wiki der github-Seite des modbus-serial packages](https://github.com/yaacov/node-modbus-serial/wiki/Example:--server) und sollte selbsterklärend sein. Es müssen nur callbacks geschrieben werden, wenn der Modbus-Server auf die Werte in den Speichertabellen zugreifen möchte, um damit modbus-client-requests zu beantworten. 

Zuletzt werden noch per `contextBridge.exposeInMainWorld` vier Funtionen der Client-Anwendung (also der Datei `virtualModel.js` zur Verfügung gestellt:

- `modbus.getCoil(addr) --> value`
- `modbus.getHoldingRegister(addr) --> value`
- `modbus.setDiscreteInput(addr, value) --> void` 
- `modbus.setInputRegister(addr, value) --> void`

Dabei ist `addr` immer die Adresse (Nummer) des Tabelleneintrags und `value` ein boolscher bzw. ganzzahliger Wert im Bereich 0..65535. 

Mit diesen Funktionen kann die Client-App die Werte in den Modbus-Tabellen auslesen bzw. verändern.

Der bisherige Teil (`main.js` und `preload.js`) ist so allgemein gehalten, dass auch andere virtuelle SPS-Modelle, z.B. das Schleusenmodell realisiert werden können, und dazu "nur" eine neue Client-Anwendung geschrieben werden muss.

TODO: Es ist noch nicht klar, wie man `prelaod.js` debuggen kann.

### Test des Modbus-Servers.

An dieser Stelle erfolgte bereits ein Test des Modbus-Servers mit python (apt- bzw. dnf-Paket python3-pymodbus muss installiert sein). Zuerst eine leere Datei `index.html` anlegen, damit die electron-App starten kann.

```python
from pymodbus.client.sync import ModbusTcpClient
mb_client=ModbusTcpClient(host="127.0.0.1", port=1502)

# 1000...start-Adresse, 3=Anzahl zu lesender Register
resp = mb_client.read_holding_registers(10, 3)  
resp.isError() # --> False
resp.getRegister(0) # --> 0 ...Wert an Adresse 10
resp.getRegister(1) # --> 0 ...Wert an Adresse 11
resp.getRegister(2) # --> 0 ...Wert an Adresse 12

resp = mb_client.write_registers(9, [99, 100, 101, 102])
resp.isError() # --> False
# Ein nochmaliges Lesen wie oben (Startadresse 100, count=4) liefert die
# Werte 100, 102 und 103, 0
resp = mb_client.write_coils(10 , [True, True, True])
resp = mb_client.read_coils(10, 4)
resp.getBit(0) # --> True
resp.getBit(3) # --> False
```

Wenn man die App nicht per `yarn start`, sonder per per node main.js startet, kann man im node.js-Terminal kann man die Zugriffe auf die internen Tabellen beobachten, wenn die Umgebungsvariable `MODBUS_DEBUG` auf true gesetzt ist. EDIT: Das funktioniert nicht mehr mit Electron, da die laufenden Ausgaben des Preload-Scritps von den Chrome-Dev-Tools versteckt werden. Es kommt nur die Anzeige "hidden" und die Anzahl der versteckten Messages.


## Client-Anwendung - index.html

Die html-Datei `index.html` bestimmt das Aussehen der Client-Anwendung im BroswerWindow. Die eigentliche Logik hinter dem Schrankenmodell ist in der Javascript-Datei `virtualModel.js` realisiert. Die (veränderbare) Grafik ist in der SVG-Datei `virtualModel.svg` enthalten. Außer den Verweisen auf diese beiden Dateien sind nur noch ein paar Buttons, Checkboxes und Slider in `index.html` enthalten. Mit diesen Buttons und Slidern können Autos platziert und bewegt werden, und die Kartenleser "aktiviert" werden.

Die Javascript-Datei wird folgendermaßen eingebunden:

```html
<script src="virtualModel.js"></script>
```

Die SVG-Datei `virtualModel.svg` wurde mit inkscape erstellt, und die zu verändernden Elemente haben eine besondere "id" erhalten (mit dem XML-Editor in Inkscape). Damit von der Javascript-Datei `virtualModel.js` auf die Elemente in der SVG-Datei `virtualModel.svg` zugegriffen werden kann, muss die SVG-Datei ebenfalls auf eine besondere Art und Weise in `index.html` eingebunden werden siehe [hier](https://www.petercollingridge.co.uk/tutorials/svg/interactive/javascript/):

```html
<object id="svg-object" data="virtualModel.svg" type="image/svg+xml"></object>
```

In der Javascript-Datei erfolgt der Zugriff auf ein Element in etwa folgendermaßen:

```Javascript
let svgObject; 

window.onload = () => {
    svgObject = document.getElementById('svg-object').contentDocument;
}

...

svgObject.getElementById("barrier_exit").setAttribute("height", "150");
```

Das `svgObject` muss nur einmal eingelesen werden. Danach können per `svgObject.getElementById` Elemente aus der svg-Datei manipuliert werden. 

Weitere Besonderheit: Den Buttons kann kein "onclick=..."- Attribut gegeben werden, das eine Javascript-Funktion aus `virtualModel.js` aufruft. Das füht anscheinend zu Sicherheitsproblemen. Die Lösung besteht darin, dass die Buttons und Slider nur eine "id" erhalten, und in der Javascript-Datei wird ihnen per `document.getElementById(...).addEventListener()` ein Listener hinzugefügt.

Folgende Slider sind vorhanden:
- `sld_car_pos_entrance` für die Position des Autos bei der Einfahrt.
- `sld_car_pos_exit` für die Position des Autos bei der Ausfahrt.

Folgende Buttons sind vorhanden:
- `btn_put_car_entrance` und `btn_put_car_exit` um ein Auto vor den Einfahrts- bzw. Ausfahrtsschranken zu stellen
- `btn_park_car_entrance` und `btn_car_exit_leaves`  um ein Auto nach Passieren eines Schrankens zu entfernen. Beim Einfahrsschranken wird das Auto dadurch in einen Parkplatz "gestellt".
- `btn_card_entrance` und `btn_card_exit` dür das Kartenleser-Signal. Ein Drücken eines der Button löst das zugehörige Card-Signal für eine Sekunde lang aus.
- `btn_cb_plus`, `btn_cb_minus` für die Korrekton-Buttons. Ein Klick auf die Buttons löst das zugehörige Signal ebenfalls eine Sekunde lang aus.

Folgende Checkboxes sind vorhanden:
- `chk_key_switch` und `chk_gas_alarm` sind direkt mit den zugehörigen Signalen verknüpft.


## Client-Anwendung - virtualModel.svg

Die svg-Datei wurde mit inkscape erstellt, und mit dem XML-Editor von inkscape (Menü Bearbeiten >> XML-Editor) wurde den zu manipulierenden SVG-Elementen eine besondere "id" gegeben:

- `barrier_entrance`, `barrier_exit`: Attribut "height" ...Damit kann der Schranken virtuell geschlossen/geöffnet werden (Länge des Rechtecks wird verändert).
- `car_entrance` und `car_exit`: transform: translate(x,y) ...Position der Autos, sowie style.display="" bzw. "none" um die Autos nicht anzuzeigen.
- `parked_car_1` bis `parked_car_10`: style.display 
- `indloop_before_entrance`, `indloop_after_entrance`, `indloop_before_exit`, `indloop_after_exit`: style.fill ...Farbe verändern, wenn ein Auto darüber ist.
- `card_extrance` und `card_exit` ...Farbe verändern, wenn eine Karte vorhanden ist.
- `lamp_warn_entrance`, `lamp_warn_exit`, `lamp_free`, lamp_full`: style.fill ...Farbe ändern.
- `led_input_0` bis `led_input_14` und `led_coil_0` bis `led_coil_7` ...style.fill um die Led ein- bzw. auszuschalten. Diese zeigen die Zuständen der discrete inputs und der coils des Modbus-Servers an.
- `smoke_entrance` und `smoke_exit` zum Anzeigen der Motor-Überlastung.
- `crash_entrance` und `crash_exit` um Anzuzeigen, dass Auto und Schranken kollidieren.

## Client-Anwendung - virtualModel.js

In dieser Datei wird die eigentliche Logik des virutellen Modells realisiert. 

### Globaler Modellzustand
Zuerst werden folgende globale Varialben angelegt, die den aktuellen Zustand des Modells enthalten:

```Javascript
let parkedCarsCount = 0;   // between 0 and 10 (inklisive)
let carAtEntrancePresent = false;
let carAtExitPresent=false;
let carPosEntrance = 0.0;  // between 0.0 and 1.0
let carPosExit = 0.0;      // between 0.0 and 1.0
let barrierPosEntrance = Math.random();// between 0.0 and 1.0
let barrierPosExit = Math.random();    // between 0.0 and 1.0
let motorOverloadTimeEntrance=0; // 0 is cool, 2000 (ms) means overloaded
let motorOverloadTimeExit=0;     // 0 is cool, 2000 (ms) means overloaded
```

### draw-Funktionen zum Manipulieren der SVG-Elemente

Danach folgt die Definition der Funktionen `drawCars()`, `drawBarriers()`, `drawParkedCars()`, `drawInputLedState(ledNumber, val)` und `drawCoilLedState(ledNumber, val)`. In diesen Funktionen ist de Zugriff auf die entsprechenden Objekte in der SVG-Datei gekapselt. Die Funktinen greifen auf den aktuellen Zustand des Modells (obige Variablen) zu und verändern dementsprechend die SVG-Objekte.

Bei den Autos (`drawCars()`) werden die Modell-Zustands-Variablen `carAtEntrancePresent`, `carAtExitPresent`, `carPosEntrance` und `carPosExit` verwendet, um Die beiden Auto-Objekte bei der Einfahrt und der Ausfahrt anzuzeigen oder zu verstecken (`.style.display=""` bzw. `="none"`) und die x-Positin der Autos zu manipulieren. Das erfolgt mit dem `e`-Element der Transformationsmatrix `svgObject.getElementById("car_exit").transform.baseVal[0].matrix.e`.

Bei den Schranken (`drawBarriers()`) erfolgt die Manipulation durch das "height"-Attribut des entsprechenden Rechtecks. Dazu werden den Modell-Zustands-Variablen `barrierPosEntrance` und `barrierPosExit` verwendet. Außerdem wird auch noch überprüft, ob ein Motor überlastet ist (`motorOverloadTimeEntrance` bzw. `motorOverloadTimeExit` größer als 5000 Millisekunden) und dementsprechend ein `smoke_entrance` bzw. `smoke_exit` Symbol angezeigt/versteckt. Wenn ein Auto mit einem Schranken kollidiert, wird ein `crash_entrance` bzw. `crash_exit`-Symbol angezeigt.

Die Funktion `drawParkedCars()` zeigt die in `parkedCarsCount` abgespeicherte Anzahl an geparkten Autos an (bzw. versteckt die nicht geparkten Autos). Die Funktionen für die LEDs ändern nur die Hintergrudnfarbe (`style.fill`) der entsprechenden LED-Objekte.

Die draw-Funktionen werden von anderen Funktinen jedes Mal dann aufgerufen, wenn sich das SGV-Bild ändern soll.

### Zyklisch aufgerufene Funktionen

Die Funktionen `cyclicMoveBarriers()` und `cyclicLamps()` werden zyklisch aufgerufen (alle `TIMER_INTERVAL` Millisekunden). Die Initialisierung dieser zyklischen Aufrufe erfolgt per `setInterval()` im `window.onload()`-Eventhandler

Die Funktion `cyclicMoveBarriers()` liest die Modbus-Coils der Motor-Signale ein und verändert demenstprechend die Modell-Zustands-Variablen `barrierPosEntrance`, `barrierPosExit`, `motorOverloadTimeEntrance` und `motorOverloadTimeExit`. Außerdem werden die Endschalter-Signale (Modbus-discrete-Inputs) dementsprechend gesetzt. Zuletzt werden der neu berechnete Modellzustand mittels `drawBarriers()` gezeichnet.

Die Funktion `cyclicLamps()` liest die Coils ein mit denen die vier Lampen angesteuert werden. Damit werden in der SVG-Datei die entsprechnden `fill.style`-Farben der Lampen gesetzt, und die entsprechenden LEDs bei den Coils ein/ausgeschaltet.

### Eventhandler

Folgende Eventhandler werden aufgerufen, wenn die entsprechenden Buttons, Checkboxes und Slider betätigt werden:

- `onPutCarAtEntrance()` sowie `onPutCarAtExit()` 
- `onRemoveCarAtEntrance()` sowie `onRemoveCarAtExit()` 
- `onCarAtEntranceMoved()` sowie `onCarAtExitMoved()`, wenn die Slider betätigt werden. In diesen Handlern wird `carPosEntrance` bzw. `carPosExit` gesetzt. Es wird auch überprüft, ob das zugehörioge Auto über den Induktionsschleifen steht, und die entsprechenden discrete-inputs und LEDs gesetzt.

Die Eventhandler für Buttons/Slider enablen/disablen auch jeweils andere Buttons/Slider.

Zusätzlich gibt es noch folgende einfache Handler:

- `onCardEntrance()` sowie `onCardExit()`: Bei Betätigen dieses Buttons werden für eine Sekunde der entsprechende discrete-Input zusammen mit seiner LED aktiviert und der Kartenleser im Bild ändert seine Farbe.
- `onCorrectionButtonPlus()` und `onCorrectionButtonMinus()` aktivieren für 300ms den entsprechenden discrete-input und die zugehörige LED.
- Die Handler für die Checkboxes `onKeySwitchChanged()` und `onGasAlarmChanged()` geben den checked-Zustand der Checkboxes direkt an die zugehörigen discrete-Inputs und die zugehörigen LEDs weiter.

### window.onload()

Im `window.onload()`-Handler wird die svg-Zeichnung durch Aufruf aller draw-Funktionen initialisiert, die Eventhandler an die entsprechenden HTML-Buttons/Slider/Checkboxes gebunden und die beiden zyklischen Timer für `cyclicMoveBarriers()` und `cyclicLamps()` gestartet.

# Project ausrollen

...siehe 
- (Elektron Quickstart - package and distribute your Application)[https://www.electronjs.org/docs/tutorial/quick-start#package-and-distribute-your-application]
- (Electron Forge - Getting started)[https://www.electronforge.io/]
- (Electron Forge - Import Existing PRoject)[https://www.electronforge.io/import-existing-project]

Details: siehe `README.mnd` - Deploying
