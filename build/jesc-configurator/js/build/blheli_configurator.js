'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var METAINFO_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

// Fix for nw.js which has regeneratorRuntime defined in global.
if (window.regeneratorRuntime == undefined) {
    window.regeneratorRuntime = global.regeneratorRuntime;
}

window.uiLocked = false;

var Configurator = React.createClass({
    displayName: "Configurator",

    getInitialState: function getInitialState() {
        return {
            canRead: true,
            canWrite: false,
            canFlash: false,
            canFlashTlm: false,
            isFlashing: false,
            isLicensed: true,
            isLocked: false,
            isL: false,
            selectingFirmware: false,
            licensingAll: false,
            hasTelemetry: false,
            isActivated: false,
            noteStyle: "note",
            noteText: "escFeaturesHelp",
            escSettings: [],
            escMetainfo: [],

            ignoreMCULayout: false,

            flashingEscIndex: undefined,
            flashingEscProgress: 0
        };
    },
    componentWillMount: function componentWillMount() {
        this.updateVersionsMetainfo();
        var interval = setInterval(this.updateVersionsMetainfo, METAINFO_UPDATE_INTERVAL_MS);

        this.setState({
            updateInterval: interval
        });
    },
    componentWillUnmount: function componentWillUnmount() {
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
        }
    },
    updateVersionsMetainfo: function updateVersionsMetainfo() {
        var _this = this;

        fetchJSON(BLHELI_ESCS_KEY, BLHELI_ESCS_REMOTE, BLHELI_ESCS_LOCAL).then(function (json) {
            return _this.setState({ supportedESCs: json });
        });

        fetchJSON(BLHELI_VERSIONS_KEY, BLHELI_VERSIONS_REMOTE, BLHELI_VERSIONS_LOCAL).then(function (json) {
            return _this.setState({ firmwareVersions: json });
        });
    },
    onUserInput: function onUserInput(newSettings) {
        this.setState({
            escSettings: newSettings
        });
    },
    saveLog: function saveLog() {
        return saveFile(console.dump().join('\n'));
    },
    licenseAll: function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            this.setState({ licensingAll: true });

                        case 1:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        function licenseAll() {
            return _ref.apply(this, arguments);
        }

        return licenseAll;
    }(),
    readSetup: function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            var _this2 = this;

            var availableSettings, availableMetainfos, isLicensed, isActivated, isLocked, isJesc, hasTelemetry, isL, i, canFlash, canResetDefaults, noteStyle, noteText;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            GUI.log(chrome.i18n.getMessage('readSetupStarted'));

                            _context2.next = 3;
                            return _4way.getProtocolVersion();

                        case 3:
                            this.version = _context2.sent;

                            GUI.log("Protocol Version: " + this.version);
                            $('a.connect').addClass('disabled');

                            // disallow further requests until we're finished
                            // @todo also disable settings alteration
                            this.setState({
                                canRead: false,
                                canWrite: false,
                                canFlash: false,
                                canFlashTlm: false
                            });

                            _context2.prev = 7;
                            _context2.next = 10;
                            return this.readSetupAll();

                        case 10:
                            GUI.log(chrome.i18n.getMessage('readSetupFinished'));
                            _context2.next = 16;
                            break;

                        case 13:
                            _context2.prev = 13;
                            _context2.t0 = _context2["catch"](7);

                            GUI.log(chrome.i18n.getMessage('readSetupFailed', [_context2.t0.stack]));

                        case 16:

                            // Enable `Flash All` if all ESCs are identical
                            availableSettings = this.state.escSettings.filter(function (i, idx) {
                                return _this2.state.escMetainfo[idx].available;
                            });
                            // @todo remove when Atmel flashing has been checked

                            availableMetainfos = this.state.escMetainfo.filter(function (info) {
                                return info.available;
                            });
                            isLicensed = true;
                            isActivated = true;
                            isLocked = false;
                            isJesc = true;
                            hasTelemetry = true;
                            isL = false;

                            for (i = 0; i < this.props.escCount; i++) {
                                if (!this.state.escMetainfo[i].isLicensed) {
                                    isLicensed = false;
                                }
                                if (!this.state.escMetainfo[i].isActivated) {
                                    isActivated = false;
                                }
                                if (this.state.escMetainfo[i].isL) {
                                    isL = true;
                                }
                                if (this.state.escMetainfo[i].isLocked) {
                                    isLocked = true;
                                }
                                if (!this.state.escMetainfo[i].isJesc) {
                                    isJesc = false;
                                }
                                if (this.state.escMetainfo[i].tlmVersion == 0) {
                                    hasTelemetry = false;
                                }
                            }

                            canFlash = availableSettings.every(function (settings) {
                                return settings.LAYOUT === availableSettings[0].LAYOUT;
                            });
                            canResetDefaults = availableSettings.every(function (settings) {
                                return settings.LAYOUT_REVISION > BLHELI_S_MIN_LAYOUT_REVISION;
                            });
                            noteStyle = "note";
                            noteText = "escFeaturesHelp";

                            if (this.noteStyle == 'error') {
                                this.noteStyle = '';
                                noteStyle = 'alert';
                                noteText = this.noteText;
                            } else {
                                noteText = "escFeaturesHelp";

                                if (isLocked) {
                                    noteStyle = "alert";
                                    noteText = "escWarnLocked";
                                } else {
                                    if (this.props.escCount && !isLicensed && !isL) {
                                        noteStyle = "info";
                                        noteText = "escFeaturesHelpUnlicensed";
                                    } else if (isLicensed && !hasTelemetry) {
                                        noteStyle = "alert";
                                        if (!isActivated) {
                                            noteText = "escWarnJESC";
                                        } else {
                                            noteText = "escWarnTelemetry";
                                        }
                                    }
                                }
                            }

                            this.setState({
                                canRead: true,
                                canWrite: availableSettings.length > 0,
                                canFlash: availableSettings.length > 0 && canFlash,
                                canFlashTlm: availableSettings.length > 0 && canFlash && isJesc && isLicensed && isActivated && !isL,
                                canResetDefaults: canResetDefaults,
                                hasTelemetry: hasTelemetry,
                                isLicensed: availableSettings.length == 0 || isLicensed,
                                isActivated: isActivated,
                                isLocked: isLocked,
                                noteStyle: noteStyle,
                                noteText: noteText,
                                isL: isL
                            });

                            $('a.connect').removeClass('disabled');

                        case 32:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this, [[7, 13]]);
        }));

        function readSetup() {
            return _ref2.apply(this, arguments);
        }

        return readSetup;
    }(),
    readSetupAll: function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
            var escSettings, escMetainfo, uidQuery, uidCount, esc, message, interfaceMode, isSiLabs, settingsArray, data3, _data, data2, uidHex, uid, layoutChanged, data, pos, address, d, timing, i, timingStr, settings, deferred, result, _esc, _esc2;

            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            escSettings = [], escMetainfo = [];

                            if (!Debug.enabled) {
                                _context3.next = 6;
                                break;
                            }

                            escSettings = [Debug.getDummySettings(BLHELI_TYPES.BLHELI_S_SILABS)];
                            escMetainfo = [Debug.getDummyMetainfo(BLHELI_TYPES.BLHELI_S_SILABS)];

                            this.setState({
                                escSettings: escSettings,
                                escMetainfo: escMetainfo
                            });

                            return _context3.abrupt("return");

                        case 6:
                            uidQuery = '';
                            uidCount = 1;
                            esc = 0;

                        case 9:
                            if (!(esc < this.props.escCount)) {
                                _context3.next = 100;
                                break;
                            }

                            escSettings.push({});
                            escMetainfo.push({});

                            _context3.prev = 12;
                            _context3.next = 15;
                            return _4way.initFlash(esc);

                        case 15:
                            message = _context3.sent;


                            // Check interface mode and read settings
                            interfaceMode = message.params[3];

                            // remember interface mode for ESC

                            escMetainfo[esc].interfaceMode = interfaceMode;
                            // @todo C2 will require redesign here
                            escMetainfo[esc].signature = message.params[1] << 8 | message.params[0];

                            // read everything in one big chunk
                            // SiLabs has no separate EEPROM, but Atmel has and therefore requires a different read command
                            isSiLabs = [_4way_modes.SiLC2, _4way_modes.SiLBLB].includes(interfaceMode), settingsArray = null;


                            escMetainfo[esc].isLocked = false;
                            escMetainfo[esc].isActivated = false;
                            escMetainfo[esc].tlmVersion = undefined;
                            escMetainfo[esc].isJesc = false;

                            if (!isSiLabs) {
                                _context3.next = 56;
                                break;
                            }

                            _context3.next = 27;
                            return _4way.read(BLHELI_SILABS_EEPROM_OFFSET, BLHELI_LAYOUT_SIZE);

                        case 27:
                            settingsArray = _context3.sent.params;
                            _context3.next = 30;
                            return _4way.read(0xb0, 0x10);

                        case 30:
                            data3 = _context3.sent.params;

                            escMetainfo[esc].isJesc = buf2ascii(data3.subarray(0, 4)) == 'JESC';
                            if (escMetainfo[esc].isJesc) {
                                escMetainfo[esc].pwm = buf2ascii(data3.subarray(8, 10));
                            }
                            escMetainfo[esc].isL = settingsArray[0x43] == "L".charCodeAt(0);

                            if (escMetainfo[esc].isL) {
                                _context3.next = 54;
                                break;
                            }

                            _context3.next = 37;
                            return _4way.read(0xfbfc, 4);

                        case 37:
                            _data = _context3.sent.params;

                            if (_data[0] != 0 && _data[1] == 0xa5 && _data[2] == 0xa5) escMetainfo[esc].isActivated = true;
                            if (_data[3] != 255) {
                                escMetainfo[esc].isLocked = true;
                            }

                            _context3.next = 42;
                            return _4way.read(0x3e00, 5);

                        case 42:
                            data2 = _context3.sent.params;

                            escMetainfo[esc].tlmVersion = 0;
                            if (buf2ascii(data2.subarray(0, 3)) == 'TLX') {
                                escMetainfo[esc].tlmVersion = data2[3] + '.' + data2[4];
                            }

                            uidHex = '';
                            _context3.next = 48;
                            return _4way.read(0xffc0, 16);

                        case 48:
                            uid = _context3.sent.params;

                            uid.forEach(function (elem) {
                                var h = '0' + elem.toString(16);uidHex += h.slice(h.length - 2, h.length);
                            });
                            GUI.log('uid: ' + uidHex);
                            escMetainfo[esc].uid = uidHex;
                            if (uidQuery == '') uidQuery = 'https://jflight.net/checkuids2.php?';
                            uidQuery += 'uid' + esc + '=' + uidHex + '&';

                        case 54:
                            _context3.next = 59;
                            break;

                        case 56:
                            _context3.next = 58;
                            return _4way.readEEprom(0, BLHELI_LAYOUT_SIZE);

                        case 58:
                            settingsArray = _context3.sent.params;

                        case 59:
                            layoutChanged = false;

                            if (escMetainfo[esc].isJesc) {
                                _context3.next = 85;
                                break;
                            }

                            data = new Uint8Array(0x300);
                            pos = 0;
                            address = 0x250;

                        case 64:
                            if (!(address < 0x550)) {
                                _context3.next = 73;
                                break;
                            }

                            _context3.next = 67;
                            return _4way.read(address, 0x80);

                        case 67:
                            d = _context3.sent.params;

                            data.set(d, pos);
                            pos += 0x80;

                        case 70:
                            address += 0x80;
                            _context3.next = 64;
                            break;

                        case 73:
                            timing = 0;
                            i = 0;

                        case 75:
                            if (!(i < 0x300 - 5)) {
                                _context3.next = 83;
                                break;
                            }

                            if (!(data[i] == 0xf9 && data[i + 1] == 0xc3 && data[i + 2] == 0xe8 && data[i + 3] == 0x94)) {
                                _context3.next = 80;
                                break;
                            }

                            timing = data[i + 4];
                            if (!escMetainfo[esc].isL) timing /= 2;
                            return _context3.abrupt("break", 83);

                        case 80:
                            i++;
                            _context3.next = 75;
                            break;

                        case 83:
                            if (timing) {
                                timingStr = String(timing);

                                if (timingStr.length < 2) timingStr = "0" + timingStr;
                                timingStr += "# ";
                                for (i = 0; i < timingStr.length; i++) {
                                    if (settingsArray[0x45 + i] != timingStr.charCodeAt(i)) {
                                        layoutChanged = true;
                                        settingsArray[0x45 + i] = timingStr.charCodeAt(i);
                                    }
                                }
                            }
                            if (layoutChanged) {
                                GUI.log("Detected nefarious timing: " + timing);
                                escMetainfo[esc].settingsArray = settingsArray;
                            }

                        case 85:
                            settings = blheliSettingsObject(settingsArray);


                            escSettings[esc] = settings;
                            escMetainfo[esc].available = true;

                            //                googleAnalytics.sendEvent('ESC', 'LOCKED', escMetainfo[esc].isLocked);
                            //                googleAnalytics.sendEvent('ESC', 'VERSION', settings.MAIN_REVISION + '.' + settings.SUB_REVISION);
                            //                googleAnalytics.sendEvent('ESC', 'LAYOUT', settings.LAYOUT.replace(/#/g, ''));
                            //                googleAnalytics.sendEvent('ESC', 'MODE', blheliModeToString(settings.MODE));
                            //                googleAnalytics.sendEvent('ESC', 'COMMUTATION_TIMING', settings.COMMUTATION_TIMING);
                            //                googleAnalytics.sendEvent('ESC', 'DEMAG_COMPENSATION', settings.DEMAG_COMPENSATION);
                            //                googleAnalytics.sendEvent('ESC', 'STARTUP_POWER', settings.STARTUP_POWER);
                            //                googleAnalytics.sendEvent('ESC', 'PPM_MIN_THROTTLE', settings.PPM_MIN_THROTTLE);
                            //                googleAnalytics.sendEvent('ESC', 'PPM_MAX_THROTTLE', settings.PPM_MAX_THROTTLE);

                            if (!isSiLabs) {
                                _context3.next = 91;
                                break;
                            }

                            _context3.next = 91;
                            return _4way.reset(esc);

                        case 91:
                            _context3.next = 97;
                            break;

                        case 93:
                            _context3.prev = 93;
                            _context3.t0 = _context3["catch"](12);

                            console.log('ESC', esc + 1, 'read settings failed', _context3.t0.message);
                            escMetainfo[esc].available = false;

                        case 97:
                            ++esc;
                            _context3.next = 9;
                            break;

                        case 100:
                            _context3.prev = 100;

                            if (!(uidQuery != '')) {
                                _context3.next = 113;
                                break;
                            }

                            deferred = Q.defer();

                            $.get(uidQuery, function (content) {
                                return deferred.resolve(content);
                            }).fail(function () {
                                GUI.log("couldn't retrieve esc status due to internet availability");
                                return deferred.reject(new Error('File is unavailable'));
                            });
                            _context3.t1 = JSON;
                            _context3.next = 107;
                            return deferred.promise;

                        case 107:
                            _context3.t2 = _context3.sent;
                            result = _context3.t1.parse.call(_context3.t1, _context3.t2);


                            for (_esc = 0; _esc < this.props.escCount; ++_esc) {
                                escMetainfo[_esc].isLicensed = result[_esc] != 0;
                            };
                            _context3.next = 114;
                            break;

                        case 113:
                            for (_esc2 = 0; _esc2 < this.props.escCount; ++_esc2) {
                                escMetainfo[_esc2].isLicensed = false;
                            }

                        case 114:
                            _context3.next = 119;
                            break;

                        case 116:
                            _context3.prev = 116;
                            _context3.t3 = _context3["catch"](100);

                            console.log('read license status failed', _context3.t3.message);

                        case 119:

                            // Update backend and trigger representation
                            this.setState({
                                escSettings: escSettings,
                                escMetainfo: escMetainfo
                            });

                        case 120:
                        case "end":
                            return _context3.stop();
                    }
                }
            }, _callee3, this, [[12, 93], [100, 116]]);
        }));

        function readSetupAll() {
            return _ref3.apply(this, arguments);
        }

        return readSetupAll;
    }(),
    // @todo add validation of each setting via BLHELI_SETTINGS_DESCRIPTION
    writeSetupAll: function () {
        var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
            var esc;
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            esc = 0;

                        case 1:
                            if (!(esc < this.state.escSettings.length)) {
                                _context4.next = 7;
                                break;
                            }

                            _context4.next = 4;
                            return this.writeSetupImpl(esc);

                        case 4:
                            ++esc;
                            _context4.next = 1;
                            break;

                        case 7:
                        case "end":
                            return _context4.stop();
                    }
                }
            }, _callee4, this);
        }));

        function writeSetupAll() {
            return _ref4.apply(this, arguments);
        }

        return writeSetupAll;
    }(),
    writeSetupImpl: function () {
        var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(esc) {
            var message, interfaceMode, isSiLabs, readbackSettings, escSettings, pos, offset;
            return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                    switch (_context5.prev = _context5.next) {
                        case 0:
                            _context5.prev = 0;

                            if (this.state.escMetainfo[esc].available) {
                                _context5.next = 3;
                                break;
                            }

                            return _context5.abrupt("return");

                        case 3:
                            _context5.next = 5;
                            return _4way.initFlash(esc);

                        case 5:
                            message = _context5.sent;

                            // Remember interface mode and read settings
                            interfaceMode = message.params[3];

                            // read everything in one big chunk to check if any settings have changed
                            // SiLabs has no separate EEPROM, but Atmel has and therefore requires a different read command

                            isSiLabs = [_4way_modes.SiLC2, _4way_modes.SiLBLB].includes(interfaceMode), readbackSettings = null;

                            if (!isSiLabs) {
                                _context5.next = 14;
                                break;
                            }

                            _context5.next = 11;
                            return _4way.read(BLHELI_SILABS_EEPROM_OFFSET, BLHELI_LAYOUT_SIZE);

                        case 11:
                            readbackSettings = _context5.sent.params;
                            _context5.next = 17;
                            break;

                        case 14:
                            _context5.next = 16;
                            return _4way.readEEprom(0, BLHELI_LAYOUT_SIZE);

                        case 16:
                            readbackSettings = _context5.sent.params;

                        case 17:

                            // Check for changes and perform write
                            escSettings = blheliSettingsArray(this.state.escSettings[esc]);

                            // check for unexpected size mismatch

                            if (!(escSettings.byteLength != readbackSettings.byteLength)) {
                                _context5.next = 20;
                                break;
                            }

                            throw new Error('byteLength of buffers do not match');

                        case 20:
                            if (!compare(escSettings, readbackSettings)) {
                                _context5.next = 23;
                                break;
                            }

                            GUI.log(chrome.i18n.getMessage('writeSetupNoChanges', [esc + 1]));
                            return _context5.abrupt("return");

                        case 23:
                            if (!isSiLabs) {
                                _context5.next = 31;
                                break;
                            }

                            _context5.next = 26;
                            return _4way.pageErase(BLHELI_SILABS_EEPROM_OFFSET / BLHELI_SILABS_PAGE_SIZE);

                        case 26:
                            _context5.next = 28;
                            return _4way.write(BLHELI_SILABS_EEPROM_OFFSET, escSettings);

                        case 28:
                            GUI.log(chrome.i18n.getMessage('writeSetupBytesWritten', [esc + 1, escSettings.byteLength]));
                            _context5.next = 43;
                            break;

                        case 31:
                            pos = 0;

                        case 32:
                            if (!(pos < escSettings.byteLength)) {
                                _context5.next = 43;
                                break;
                            }

                            offset = pos;

                            // find the longest span of modified bytes

                            while (escSettings[pos] != readbackSettings[pos]) {
                                ++pos;
                            }

                            // byte unchanged, continue

                            if (!(offset == pos)) {
                                _context5.next = 37;
                                break;
                            }

                            return _context5.abrupt("continue", 40);

                        case 37:
                            _context5.next = 39;
                            return _4way.writeEEprom(offset, escSettings.subarray(offset, pos));

                        case 39:
                            GUI.log(chrome.i18n.getMessage('writeSetupBytesWritten', [esc + 1, pos - offset]));

                        case 40:
                            ++pos;
                            _context5.next = 32;
                            break;

                        case 43:
                            if (!isSiLabs) {
                                _context5.next = 49;
                                break;
                            }

                            _context5.next = 46;
                            return _4way.read(BLHELI_SILABS_EEPROM_OFFSET, BLHELI_LAYOUT_SIZE);

                        case 46:
                            readbackSettings = _context5.sent.params;
                            _context5.next = 52;
                            break;

                        case 49:
                            _context5.next = 51;
                            return _4way.readEEprom(0, BLHELI_LAYOUT_SIZE);

                        case 51:
                            readbackSettings = _context5.sent.params;

                        case 52:
                            if (compare(escSettings, readbackSettings)) {
                                _context5.next = 54;
                                break;
                            }

                            throw new Error('Failed to verify settings');

                        case 54:
                            if (!isSiLabs) {
                                _context5.next = 57;
                                break;
                            }

                            _context5.next = 57;
                            return _4way.reset(esc);

                        case 57:
                            _context5.next = 62;
                            break;

                        case 59:
                            _context5.prev = 59;
                            _context5.t0 = _context5["catch"](0);

                            GUI.log(chrome.i18n.getMessage('writeSetupFailedOne', [esc + 1, _context5.t0.message]));

                        case 62:
                        case "end":
                            return _context5.stop();
                    }
                }
            }, _callee5, this, [[0, 59]]);
        }));

        function writeSetupImpl(_x) {
            return _ref5.apply(this, arguments);
        }

        return writeSetupImpl;
    }(),
    writeSetup: function () {
        var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
            return regeneratorRuntime.wrap(function _callee6$(_context6) {
                while (1) {
                    switch (_context6.prev = _context6.next) {
                        case 0:
                            GUI.log(chrome.i18n.getMessage('writeSetupStarted'));
                            $('a.connect').addClass('disabled');

                            // disallow further requests until we're finished
                            // @todo also disable settings alteration
                            this.setState({
                                canRead: false,
                                canWrite: false,
                                canFlash: false,
                                canFlashTlm: false,
                                isLicensed: true
                            });

                            _context6.prev = 3;
                            _context6.next = 6;
                            return this.writeSetupAll();

                        case 6:
                            GUI.log(chrome.i18n.getMessage('writeSetupFinished'));
                            _context6.next = 12;
                            break;

                        case 9:
                            _context6.prev = 9;
                            _context6.t0 = _context6["catch"](3);

                            GUI.log(chrome.i18n.getMessage('writeSetupFailed', [_context6.t0.stack]));

                        case 12:
                            _context6.next = 14;
                            return this.readSetup();

                        case 14:

                            $('a.connect').removeClass('disabled');

                        case 15:
                        case "end":
                            return _context6.stop();
                    }
                }
            }, _callee6, this, [[3, 9]]);
        }));

        function writeSetup() {
            return _ref6.apply(this, arguments);
        }

        return writeSetup;
    }(),
    resetDefaults: function resetDefaults() {
        var _this3 = this;

        var newSettings = [];

        this.state.escSettings.forEach(function (settings, index) {
            if (!_this3.state.escMetainfo[index].available) {
                newSettings.push({});
                return;
            }

            var defaults = BLHELI_S_DEFAULTS[settings.LAYOUT_REVISION];
            if (defaults) {
                for (var settingName in defaults) {
                    if (defaults.hasOwnProperty(settingName)) {
                        settings[settingName] = defaults[settingName];
                    }
                }
            }

            newSettings.push(settings);
        });

        this.setState({
            escSettings: newSettings
        });

        this.writeSetup().catch(function (error) {
            return console.log("Unexpected error while writing default setup", error);
        });
    },
    flashOne: function () {
        var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(escIndex, selectJESC) {
            return regeneratorRuntime.wrap(function _callee7$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            this.setState({
                                selectingFirmware: true,
                                escsToFlash: [escIndex],
                                selectJESC: selectJESC
                            });

                        case 1:
                        case "end":
                            return _context7.stop();
                    }
                }
            }, _callee7, this);
        }));

        function flashOne(_x2, _x3) {
            return _ref7.apply(this, arguments);
        }

        return flashOne;
    }(),
    flashFirmwareImpl: function () {
        var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(escIndex, escSettings, escMetainfo, flashImage, eepromImage, notifyProgress, restart, status) {
            var isAtmel, self, initFlashResponse, settingsArray, newSettings, prop, allSettings, updateProgress, selectInterfaceAndFlash, initialized4Way, rebindMSP, flashSiLabsBLB, flashAtmel, escSettingArrayTmp, checkESCAndMCU, writeEEpromSafeguard, writeBootloaderFailsafe, reset, erasePages, erasePage, writePages, writePage, verifyPages;
            return regeneratorRuntime.wrap(function _callee8$(_context8) {
                while (1) {
                    switch (_context8.prev = _context8.next) {
                        case 0:
                            verifyPages = function verifyPages(promise, begin, end) {
                                var begin_address = begin * BLHELI_SILABS_PAGE_SIZE,
                                    end_address = end * BLHELI_SILABS_PAGE_SIZE,
                                    step = 0x80;
                                ///            ,
                                //               promise         = Q()

                                for (var address = begin_address; address < end_address; address += step) {
                                    promise = promise.then(_4way.read.bind(_4way, address, step)).then(function (message) {
                                        if (!compare(message.params, flashImage.subarray(message.address, message.address + message.params.byteLength))) {
                                            throw new Error('failed to verify write at address 0x' + message.address.toString(0x10));
                                        }

                                        updateProgress(message.params.byteLength);
                                    });
                                }

                                return promise;
                            };

                            writePage = function writePage(page) {
                                return writePages(page, page + 1);
                            };

                            writePages = function writePages(begin, end) {
                                var begin_address = begin * BLHELI_SILABS_PAGE_SIZE,
                                    end_address = end * BLHELI_SILABS_PAGE_SIZE,
                                    step = 0x100,
                                    promise = Q();

                                for (var address = begin_address; address < end_address; address += BLHELI_SILABS_PAGE_SIZE) {
                                    for (var i = address; i < address + BLHELI_SILABS_PAGE_SIZE; i++) {
                                        if (flashImage[i] != 0xff) {
                                            promise = promise.then(erasePage.bind(undefined, address / BLHELI_SILABS_PAGE_SIZE));
                                            for (var l = address; l < address + BLHELI_SILABS_PAGE_SIZE; l += step) {
                                                promise = promise.then(_4way.write.bind(_4way, l, flashImage.subarray(l, l + step))).then(function () {
                                                    updateProgress(step);
                                                });
                                            }
                                            promise = verifyPages(promise, address / BLHELI_SILABS_PAGE_SIZE, address / BLHELI_SILABS_PAGE_SIZE + 1);
                                            break;
                                        }
                                    }
                                }

                                return promise;
                            };

                            erasePage = function erasePage(page) {
                                return erasePages(page, page + 1);
                            };

                            erasePages = function erasePages(from_page, max_page) {
                                var promise = Q();

                                for (var page = from_page; page < max_page; ++page) {
                                    promise = promise.then(_4way.pageErase.bind(_4way, page)).then(function () {
                                        updateProgress(BLHELI_SILABS_PAGE_SIZE);
                                    });
                                }

                                return promise;
                            };

                            reset = function reset() {
                                var promise = Q();
                                promise = promise.then(_4way.reset());
                                return promise;
                            };

                            writeBootloaderFailsafe = function writeBootloaderFailsafe() {
                                var ljmp_reset = new Uint8Array([0x02, 0x19, 0xFD]),
                                    ljmp_bootloader = new Uint8Array([0x02, 0x1C, 0x00]);

                                var pageZeroUsed = false;
                                for (var i = 0; i < 0x200; i++) {
                                    if (flashImage[i] != 0xff) {
                                        pageZeroUsed = true;
                                        break;
                                    }
                                }
                                // for encrypted images don't mess with page 0 etc
                                if (!pageZeroUsed) return;

                                var promise = _4way.read(0, 3)
                                // verify LJMP reset
                                .then(function (message) {
                                    if (!compare(ljmp_reset, message.params)) {
                                        // @todo LJMP bootloader is probably already there and we could skip some steps
                                    }
                                })
                                // erase second page
                                .then(erasePage.bind(undefined, 1))
                                // write LJMP bootloader
                                .then(_4way.write.bind(_4way, 0x200, ljmp_bootloader))
                                // read LJMP bootloader
                                .then(_4way.read.bind(_4way, 0x200, ljmp_bootloader.byteLength))
                                // verify LJMP bootloader
                                .then(function (message) {
                                    if (!compare(ljmp_bootloader, message.params)) {
                                        throw new Error('failed to verify `LJMP bootloader` write');
                                    }
                                })
                                // erase first page
                                .then(erasePage.bind(undefined, 0))
                                // ensure page erased to 0xFF
                                // @todo it could be beneficial to reattempt erasing first page in case of failure
                                .then(function () {
                                    var begin_address = 0,
                                        end_address = 0x200,
                                        step = 0x80,
                                        promise = Q();

                                    for (var address = begin_address; address < end_address; address += step) {
                                        promise = promise.then(_4way.read.bind(_4way, address, step)).then(function (message) {
                                            var erased = message.params.every(function (x) {
                                                return x == 0xFF;
                                            });
                                            if (!erased) {
                                                throw new Error('failed to verify erasure of the first page');
                                            }

                                            updateProgress(message.params.byteLength);
                                        });
                                    }

                                    return promise;
                                });

                                return promise;
                            };

                            writeEEpromSafeguard = function writeEEpromSafeguard() {
                                escSettingArrayTmp.set(ascii2buf('**FLASH*FAILED**'), BLHELI_LAYOUT.NAME.offset);

                                var promise = _4way.write(BLHELI_SILABS_EEPROM_OFFSET, escSettingArrayTmp).then(function (message) {
                                    return _4way.read(message.address, BLHELI_LAYOUT_SIZE);
                                }).then(function (message) {
                                    if (!compare(escSettingArrayTmp, message.params)) {
                                        throw new Error('failed to verify write **FLASH*FAILED**');
                                    }
                                });

                                return promise;
                            };

                            checkESCAndMCU = function checkESCAndMCU(escMetainfo, message) {
                                if (escMetainfo.hasOwnProperty('settingsArray')) escSettingArrayTmp = escMetainfo.settingsArray;else escSettingArrayTmp = message.params;
                                var isEncrypted = false;
                                if (!isAtmel) {
                                    var payload = buf2ascii(flashImage.subarray(0x1400, 0x1403));
                                    if (payload == 'TLX' || payload == 'TLY') isEncrypted = true;
                                }
                                if (isEncrypted) {
                                    if (self.version < 108) {
                                        self.noteStyle = 'error';
                                        self.noteText = 'errorVersion';
                                        GUI.log("Please install BetaFlight >= 4.1 before flashing Telemetry!");
                                        throw new Error('Version mismatch');
                                    }
                                    for (var i = BLHELI_SILABS_EEPROM_OFFSET; i < BLHELI_SILABS_EEPROM_OFFSET + BLHELI_LAYOUT_SIZE; i++) {
                                        flashImage[i] = escSettingArrayTmp[i - BLHELI_SILABS_EEPROM_OFFSET];
                                    }
                                }

                                var settings_image = isAtmel ? eepromImage : flashImage.subarray(BLHELI_SILABS_EEPROM_OFFSET);

                                // check LAYOUT
                                var target_layout = escSettingArrayTmp.subarray(BLHELI_LAYOUT.LAYOUT.offset, BLHELI_LAYOUT.LAYOUT.offset + BLHELI_LAYOUT.LAYOUT.size),
                                    fw_layout = settings_image.subarray(BLHELI_LAYOUT.LAYOUT.offset, BLHELI_LAYOUT.LAYOUT.offset + BLHELI_LAYOUT.LAYOUT.size);

                                if (!compare(target_layout, fw_layout)) {
                                    var target_layout_str = buf2ascii(target_layout).trim();
                                    if (target_layout_str.length == 0) {
                                        target_layout_str = 'EMPTY';
                                    }

                                    if (!self.state.ignoreMCULayout) {
                                        throw new Error(chrome.i18n.getMessage('layoutMismatch', [target_layout_str, buf2ascii(fw_layout).trim()]));
                                    }
                                }

                                // check MCU, if it does not match there's either wrong HEX or corrupted ESC. Disallow for now
                                var target_mcu = escSettingArrayTmp.subarray(BLHELI_LAYOUT.MCU.offset, BLHELI_LAYOUT.MCU.offset + BLHELI_LAYOUT.MCU.size),
                                    fw_mcu = settings_image.subarray(BLHELI_LAYOUT.MCU.offset, BLHELI_LAYOUT.MCU.offset + BLHELI_LAYOUT.MCU.size);
                                if (!compare(target_mcu, fw_mcu)) {
                                    var target_mcu_str = buf2ascii(target_mcu).trim();
                                    if (target_mcu_str.length == 0) {
                                        target_mcu_str = 'EMPTY';
                                    }

                                    if (!self.state.ignoreMCULayout) {
                                        throw new Error(chrome.i18n.getMessage('mcuMismatch', [target_mcu_str, buf2ascii(fw_mcu).trim()]));
                                    }
                                }

                                // @todo check NAME for **FLASH*FAILED**
                            };

                            flashAtmel = function flashAtmel(message) {
                                // SimonK uses word instead of byte addressing for flash and address arithmetic on subsequent reads/writes
                                var isSimonK = escMetainfo.interfaceMode === _4way_modes.AtmSK;
                                // @todo check device id

                                return _4way.readEEprom(0, BLHELI_LAYOUT_SIZE)
                                // check MCU and LAYOUT
                                .then(checkESCAndMCU)
                                // write **FLASH*FAILED** as NAME
                                .then(function () {
                                    var bytes = ascii2buf('**FLASH*FAILED**');

                                    return _4way.writeEEprom(BLHELI_LAYOUT.NAME.offset, bytes).then(_4way.readEEprom.bind(_4way, BLHELI_LAYOUT.NAME.offset, BLHELI_LAYOUT.NAME.size)).then(function (message) {
                                        if (!compare(bytes, message.params)) {
                                            throw new Error('Failed to verify write **FLASH*FAILED**');
                                        }
                                    });
                                })
                                // write RCALL bootloader_start
                                .then(function () {
                                    var address = isSimonK ? 0x20 : 0x40,

                                    // @todo This is a jump to SimonK bootloader, BLHeli bootloader is 512 bytes further, jump could be optimized
                                    rcall = new Uint8Array([0xDF, 0xCD]),
                                        bytes = new Uint8Array(64).fill(0xFF);

                                    bytes.set(rcall);

                                    return _4way.write(address, bytes).then(function () {
                                        return updateProgress(bytes.byteLength);
                                    }).then(_4way.read.bind(_4way, address, rcall.length)).then(function (message) {
                                        if (!compare(rcall, message.params)) {
                                            throw new Error('Failed to verify `RCALL bootloader` write');
                                        }

                                        updateProgress(bytes.byteLength);
                                    });
                                })
                                // erase first 64 bytes up to RCALL written in the previous step
                                .then(function () {
                                    var bytes = new Uint8Array(64).fill(0xFF);

                                    return _4way.write(0, bytes).then(function () {
                                        return updateProgress(bytes.byteLength);
                                    }).then(_4way.read.bind(_4way, 0, bytes.byteLength)).then(function (message) {
                                        if (!compare(bytes, message.params)) {
                                            throw new Error('Failed to verify erasure of first 64 bytes');
                                        }
                                        updateProgress(bytes.byteLength);
                                    });
                                })
                                // write from 0x80 up to bootloader start
                                .then(function () {
                                    var begin_address = 0x80,
                                        end_address = function () {
                                        var MCU = findMCU(escMetainfo.signature, self.state.supportedESCs.signatures.Atmel);

                                        switch (escMetainfo.interfaceMode) {
                                            case _4way_modes.AtmBLB:
                                                return MCU.flash_size - BLHELI_ATMEL_BLB_SIZE;
                                            case _4way_modes.AtmSK:
                                                return MCU.flash_size - BLHELI_ATMEL_SK_SIZE;
                                            default:
                                                throw Error('unknown interfaceMode ' + escMetainfo.interfaceMode);
                                        }
                                    }(),
                                        write_step = isSimonK ? 0x40 : 0x100,
                                        verify_step = 0x80,
                                        promise = Q();

                                    // write

                                    var _loop = function _loop() {
                                        end = Math.min(address + write_step, end_address);
                                        write_address = address;

                                        var bytesToWrite = end - address;

                                        if (isSimonK) {
                                            if (address === begin_address) {
                                                write_address /= 2;
                                            } else {
                                                // SimonK bootloader will continue from the last address where we left off
                                                write_address = 0xFFFF;
                                            }
                                        }

                                        promise = promise.then(_4way.write.bind(_4way, write_address, flashImage.subarray(address, end))).then(function (message) {
                                            updateProgress(bytesToWrite);
                                        });
                                    };

                                    for (var address = begin_address; address < end_address; address += write_step) {
                                        var end, write_address;

                                        _loop();
                                    }

                                    // verify

                                    var _loop2 = function _loop2(_address) {
                                        bytesToRead = Math.min(_address + verify_step, end_address) - _address;
                                        read_address = _address;


                                        if (isSimonK) {
                                            if (_address === begin_address) {
                                                // Word addressing for flash with SimonK bootloader
                                                read_address /= 2;
                                            } else {
                                                // SimonK bootloader will continue from the last address where we left off
                                                read_address = 0xFFFF;
                                            }
                                        }

                                        promise = promise.then(_4way.read.bind(_4way, read_address, bytesToRead)).then(function (message) {
                                            if (!compare(message.params, flashImage.subarray(_address, _address + message.params.byteLength))) {
                                                throw new Error('Failed to verify write at address 0x' + _address.toString(0x10));
                                            }

                                            updateProgress(message.params.byteLength);
                                        });
                                    };

                                    for (var _address = begin_address; _address < end_address; _address += verify_step) {
                                        var bytesToRead, read_address;

                                        _loop2(_address);
                                    }

                                    return promise;
                                })
                                // write 128 remaining bytes
                                .then(function () {
                                    // @todo combine
                                    if (isSimonK) {
                                        return _4way.write(0, flashImage.subarray(0, 0x40)).then(function (message) {
                                            updateProgress(0x40);
                                        }).then(_4way.write.bind(_4way, 0xFFFF, flashImage.subarray(0x40, 0x80))).then(function (message) {
                                            updateProgress(0x40);
                                        }).then(_4way.read.bind(_4way, 0, 0x80)).then(function (message) {
                                            if (!compare(message.params, flashImage.subarray(0, 0x80))) {
                                                throw new Error('Failed to verify write at address 0x' + message.address.toString(0x10));
                                            }

                                            updateProgress(message.params.byteLength);
                                        });
                                    } else {
                                        return _4way.write(0, flashImage.subarray(0, 0x80)).then(function (message) {
                                            updateProgress(0x80);
                                        }).then(_4way.read.bind(_4way, 0, 0x80)).then(function (message) {
                                            if (!compare(message.params, flashImage.subarray(message.address, message.address + message.params.byteLength))) {
                                                throw new Error('Failed to verify write at address 0x' + message.address.toString(0x10));
                                            }

                                            updateProgress(message.params.byteLength);
                                        });
                                    }
                                })
                                // write EEprom changes
                                .then(function () {
                                    var eeprom = new Uint8Array(BLHELI_ATMEL_EEPROM_SIZE),
                                        beginAddress = 0,
                                        endAddress = 0x200,
                                        step = 0x80,
                                        promise = Q();

                                    // read whole EEprom

                                    var _loop3 = function _loop3(address) {
                                        var cmdAddress = address === beginAddress || !isSimonK ? address : 0xFFFF;

                                        promise = promise.then(_4way.readEEprom.bind(_4way, cmdAddress, step)).then(function (message) {
                                            return eeprom.set(message.params, address);
                                        });
                                    };

                                    for (var address = beginAddress; address < endAddress; address += step) {
                                        _loop3(address);
                                    }

                                    // write differing bytes
                                    return promise.then(function () {
                                        var promise = Q(),
                                            max_bytes_per_write = isSimonK ? 0x40 : 0x100;

                                        // write only changed bytes for Atmel
                                        for (var pos = 0; pos < eeprom.byteLength; ++pos) {
                                            var offset = pos;

                                            // find the longest span of modified bytes
                                            while (eeprom[pos] != eepromImage[pos] && pos - offset <= max_bytes_per_write) {
                                                ++pos;
                                            }

                                            // byte unchanged, continue
                                            if (offset == pos) {
                                                continue;
                                            }

                                            // write span
                                            promise = promise.then(_4way.writeEEprom.bind(_4way, offset, eepromImage.subarray(offset, pos)));
                                        }

                                        return promise;
                                    });
                                });
                            };

                            flashSiLabsBLB = function flashSiLabsBLB(message, escMetainfo, escIndex, restart) {
                                // @todo check device id


                                // read current settings
                                var promise = _4way.read(BLHELI_SILABS_EEPROM_OFFSET, BLHELI_LAYOUT_SIZE)
                                // check MCU and LAYOUT
                                .then(checkESCAndMCU.bind(undefined, escMetainfo))
                                // erase EEPROM page
                                .then(erasePage.bind(undefined, 0x0D))
                                // write **FLASH*FAILED** as ESC NAME
                                .then(writeEEpromSafeguard)
                                // write `LJMP bootloader` to avoid bricking            
                                .then(writeBootloaderFailsafe)
                                // write & verify just erased locations
                                .then(writePages.bind(undefined, 0x02, 0x09))
                                // write & verify just erased locations
                                .then(writePages.bind(undefined, 0x0A, 0x0D)).then(writePage.bind(undefined, 0x09))
                                // write & verify first page
                                .then(writePage.bind(undefined, 0x00))
                                // erase second page
                                .then(writePage.bind(undefined, 0x01))
                                // erase EEPROM
                                .then(writePage.bind(undefined, 0x0D));
                                if (restart) {
                                    promise = promise.then(_4way.read.bind(_4way, 0x1000, 0x10)).then(_4way.read.bind(_4way, 0x1400, 0x10)).then(_4way.read.bind(_4way, 0xfbf0, 0x10)).then(_4way.reboot.bind(_4way, escIndex)).delay(500);
                                }
                                return promise;
                            };

                            rebindMSP = function rebindMSP(deferred) {
                                MSP.send_message(MSP_codes.MSP_SET_4WAY_IF, false, false, function () {
                                    return deferred.resolve();
                                });
                            };

                            initialized4Way = function initialized4Way() {
                                _4way.start();
                            };

                            selectInterfaceAndFlash = function selectInterfaceAndFlash(message, escMetainfo, escIndex, restart) {
                                var interfaceMode = message.params[3];
                                escMetainfo.interfaceMode = interfaceMode;

                                switch (interfaceMode) {
                                    case _4way_modes.SiLBLB:
                                        return flashSiLabsBLB(message, escMetainfo, escIndex, restart);
                                    case _4way_modes.AtmBLB:
                                    case _4way_modes.AtmSK:
                                        return flashAtmel(message);
                                    default:
                                        throw new Error('Flashing with interface mode ' + interfaceMode + ' is not yet implemented');
                                }
                            };

                            updateProgress = function updateProgress(bytes) {
                                status.bytes_processed += bytes;
                                notifyProgress(Math.min(Math.ceil(100 * status.bytes_processed / status.bytes_to_process), 100));
                            };

                            isAtmel = [_4way_modes.AtmBLB, _4way_modes.AtmSK].includes(escMetainfo.interfaceMode), self = this;

                            // start the actual flashing process

                            _context8.next = 18;
                            return _4way.initFlash(escIndex);

                        case 18:
                            initFlashResponse = _context8.sent;
                            _context8.next = 21;
                            return selectInterfaceAndFlash(initFlashResponse, escMetainfo, escIndex, restart);

                        case 21:
                            _context8.next = 23;
                            return _4way.initFlash(escIndex);

                        case 23:
                            _context8.next = 25;
                            return _4way.read(0x1000, 0x10);

                        case 25:
                            _context8.next = 27;
                            return _4way.read(0x1400, 0x10);

                        case 27:
                            if (escMetainfo.isL) {
                                _context8.next = 30;
                                break;
                            }

                            _context8.next = 30;
                            return _4way.read(0xfbf0, 0x10);

                        case 30:
                            if (!isAtmel) {
                                _context8.next = 36;
                                break;
                            }

                            _context8.next = 33;
                            return _4way.readEEprom(0, BLHELI_LAYOUT_SIZE);

                        case 33:
                            settingsArray = _context8.sent.params;
                            _context8.next = 39;
                            break;

                        case 36:
                            _context8.next = 38;
                            return _4way.read(BLHELI_SILABS_EEPROM_OFFSET, BLHELI_LAYOUT_SIZE);

                        case 38:
                            settingsArray = _context8.sent.params;

                        case 39:
                            // migrate settings from previous version if asked to
                            newSettings = blheliSettingsObject(settingsArray);

                            // ensure mode match

                            if (!(newSettings.MODE === escSettings.MODE)) {
                                _context8.next = 57;
                                break;
                            }

                            // find intersection between newSettings and escSettings with respect to their versions
                            for (prop in newSettings) {
                                if (newSettings.hasOwnProperty(prop) && escSettings.hasOwnProperty(prop) && blheliCanMigrate(prop, escSettings, newSettings)) {
                                    newSettings[prop] = escSettings[prop];
                                }
                            }

                            allSettings = self.state.escSettings.slice();

                            allSettings[escIndex] = newSettings;
                            self.onUserInput(allSettings);

                            GUI.log(chrome.i18n.getMessage('writeSetupStarted'));

                            _context8.prev = 46;
                            _context8.next = 49;
                            return self.writeSetupImpl(escIndex);

                        case 49:
                            GUI.log(chrome.i18n.getMessage('writeSetupFinished'));
                            _context8.next = 55;
                            break;

                        case 52:
                            _context8.prev = 52;
                            _context8.t0 = _context8["catch"](46);

                            GUI.log(chrome.i18n.getMessage('writeSetupFailed', [_context8.t0.message]));

                        case 55:
                            _context8.next = 58;
                            break;

                        case 57:
                            GUI.log('Will not write settings back due to different MODE\n');

                        case 58:
                        case "end":
                            return _context8.stop();
                    }
                }
            }, _callee8, this, [[46, 52]]);
        }));

        function flashFirmwareImpl(_x4, _x5, _x6, _x7, _x8, _x9, _x10, _x11) {
            return _ref8.apply(this, arguments);
        }

        return flashFirmwareImpl;
    }(),
    selectFirmwareForFlashAll: function selectFirmwareForFlashAll() {
        // Get indices of all available ESCs
        var escsToFlash = this.state.escMetainfo.map(function (info, idx) {
            return info.available ? idx : undefined;
        }).filter(function (_) {
            return _ !== undefined;
        });

        this.setState({
            selectingFirmware: true,
            escsToFlash: escsToFlash,
            selectJESC: true
        });
    },
    selectFirmwareForFlashAllTlm: function selectFirmwareForFlashAllTlm() {
        // Get indices of all available ESCs
        var escsToFlash = this.state.escMetainfo.map(function (info, idx) {
            return info.available ? idx : undefined;
        }).filter(function (_) {
            return _ !== undefined;
        });

        this.setState({
            selectingFirmware: true,
            escsToFlash: escsToFlash,
            selectJESC: false
        });
    },
    flashAll: function () {
        var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(hex, eep) {
            var _this4 = this;

            var getBytesToFlash, _loop4, i, newHex, deferred, eeprom, isEncrypted, escSettings, escMetainfo, status, URL, bshex;

            return regeneratorRuntime.wrap(function _callee10$(_context10) {
                while (1) {
                    switch (_context10.prev = _context10.next) {
                        case 0:
                            getBytesToFlash = function getBytesToFlash(flash) {
                                var bytesToFlash = 0;
                                for (var i = 0; i < flash.byteLength; i += BLHELI_SILABS_PAGE_SIZE) {
                                    for (var j = i; j < i + BLHELI_SILABS_PAGE_SIZE; j++) {
                                        if (flash[j] != 0xff) {
                                            bytesToFlash += BLHELI_SILABS_PAGE_SIZE;
                                            break;
                                        }
                                    }
                                }
                                return bytesToFlash * 3;
                            };

                            $('a.connect').addClass('disabled');

                            this.setState({ isFlashing: true });

                            _context10.prev = 3;
                            _loop4 = /*#__PURE__*/regeneratorRuntime.mark(function _callee9(i) {
                                var escIndex, metaInfo, interfaceMode, signature, isAtmel, flashSize, flash, payload, MCU, firstBytes, ljmpReset, ljmpCheckBootload, _MCU2, startTimestamp, bsFlash, elapsedSec;

                                return regeneratorRuntime.wrap(function _callee9$(_context9) {
                                    while (1) {
                                        switch (_context9.prev = _context9.next) {
                                            case 0:
                                                escIndex = _this4.state.escsToFlash[i];
                                                metaInfo = _this4.state.escMetainfo[escIndex], interfaceMode = metaInfo.interfaceMode, signature = metaInfo.signature, isAtmel = [_4way_modes.AtmBLB, _4way_modes.AtmSK].includes(interfaceMode);

                                                flashSize = function () {
                                                    switch (interfaceMode) {
                                                        case _4way_modes.SiLC2:
                                                            return BLHELI_SILABS_FLASH_SIZE;
                                                        case _4way_modes.SiLBLB:
                                                            {
                                                                var MCU = findMCU(signature, _this4.state.supportedESCs.signatures[BLHELI_TYPES.BLHELI_S_SILABS]) || findMCU(signature, _this4.state.supportedESCs.signatures.SiLabs);
                                                                return MCU.flash_size;
                                                            }
                                                        case _4way_modes.AtmBLB:
                                                        case _4way_modes.AtmSK:
                                                            {
                                                                var _MCU = findMCU(signature, _this4.state.supportedESCs.signatures.Atmel);
                                                                return _MCU.flash_size;
                                                            }
                                                        default:
                                                            throw Error('unknown interfaceMode ' + interfaceMode);
                                                    }
                                                }();

                                                newHex = hex;
                                                _context9.prev = 4;

                                                if (!(newHex instanceof String)) {
                                                    _context9.next = 12;
                                                    break;
                                                }

                                                newHex = newHex.replace('{1}', metaInfo.uid);
                                                deferred = Q.defer();

                                                $.get(newHex, function (content) {
                                                    return deferred.resolve(content);
                                                }).fail(function () {
                                                    return deferred.reject(new Error('File is unavailable'));
                                                });
                                                _context9.next = 11;
                                                return deferred.promise;

                                            case 11:
                                                newHex = _context9.sent;

                                            case 12:
                                                _context9.t0 = fillImage;
                                                _context9.next = 15;
                                                return parseHex(newHex);

                                            case 15:
                                                _context9.t1 = _context9.sent;
                                                _context9.t2 = flashSize;
                                                flash = (0, _context9.t0)(_context9.t1, _context9.t2);

                                                if (!eep) {
                                                    _context9.next = 25;
                                                    break;
                                                }

                                                _context9.t3 = fillImage;
                                                _context9.next = 22;
                                                return parseHex(eep);

                                            case 22:
                                                _context9.t4 = _context9.sent;
                                                _context9.t5 = BLHELI_ATMEL_EEPROM_SIZE;
                                                eeprom = (0, _context9.t3)(_context9.t4, _context9.t5);

                                            case 25:
                                                isEncrypted = false;

                                                if (isAtmel) {
                                                    _context9.next = 37;
                                                    break;
                                                }

                                                payload = buf2ascii(flash.subarray(0x1400, 0x1403));

                                                if (payload == 'TLX' || payload == 'TLY') isEncrypted = true;
                                                // Check pseudo-eeprom page for BLHELI signature
                                                MCU = buf2ascii(flash.subarray(BLHELI_SILABS_EEPROM_OFFSET).subarray(BLHELI_LAYOUT.MCU.offset).subarray(0, BLHELI_LAYOUT.MCU.size));
                                                // Check instruction at the start of address space

                                                firstBytes = flash.subarray(0, 3);
                                                ljmpReset = new Uint8Array([0x02, 0x19, 0xFD]);
                                                ljmpCheckBootload = new Uint8Array([0x02, 0x19, 0xE0]);

                                                // BLHeli_S uses #BLHELI$.
                                                // @todo add additional sanitize here to prevent user from flashing BLHeli_S on BLHeli ESC and vice versa

                                                if (!(!isEncrypted && (!(MCU.includes('#BLHELI#') || MCU.includes('#BLHELI$')) || !compare(firstBytes, ljmpReset) && !compare(firstBytes, ljmpCheckBootload)))) {
                                                    _context9.next = 35;
                                                    break;
                                                }

                                                throw new Error(chrome.i18n.getMessage('hexInvalidSiLabs'));

                                            case 35:
                                                _context9.next = 40;
                                                break;

                                            case 37:
                                                // @todo check first 2 bytes of flash as well

                                                _MCU2 = buf2ascii(eeprom.subarray(BLHELI_LAYOUT.MCU.offset).subarray(0, BLHELI_LAYOUT.MCU.size));

                                                if (_MCU2.includes('#BLHELI#')) {
                                                    _context9.next = 40;
                                                    break;
                                                }

                                                throw new Error('EEP does not look like a valid Atmel BLHeli EEprom file');

                                            case 40:

                                                //                const escIndex = this.state.escsToFlash[i];

                                                GUI.log(chrome.i18n.getMessage('escFlashingStarted', [escIndex + 1]));
                                                escSettings = _this4.state.escSettings[escIndex];
                                                escMetainfo = _this4.state.escMetainfo[escIndex];


                                                _this4.setState({
                                                    flashingEscIndex: escIndex,
                                                    flashingEscProgress: 0
                                                });

                                                startTimestamp = Date.now();
                                                status = { "bytes_to_process": getBytesToFlash(flash), "bytes_processed": 0 };

                                                if (!(!_this4.state.escMetainfo[escIndex].isL && !_this4.state.escMetainfo[escIndex].isActivated && _this4.state.escMetainfo[escIndex].isLicensed)) {
                                                    _context9.next = 64;
                                                    break;
                                                }

                                                URL = 'https://jflight.net/cgi-bin/encrypt/{1}/bl0102/0';

                                                URL = URL.replace('{1}', _this4.state.escMetainfo[escIndex].uid);

                                                deferred = Q.defer();

                                                $.get(URL, function (content) {
                                                    return deferred.resolve(content);
                                                }).fail(function () {
                                                    return deferred.reject(new Error('File is unavailable'));
                                                });
                                                _context9.next = 53;
                                                return deferred.promise;

                                            case 53:
                                                bshex = _context9.sent;
                                                _context9.t6 = fillImage;
                                                _context9.next = 57;
                                                return parseHex(bshex);

                                            case 57:
                                                _context9.t7 = _context9.sent;
                                                _context9.t8 = flashSize;
                                                bsFlash = (0, _context9.t6)(_context9.t7, _context9.t8);

                                                status.bytes_to_process += getBytesToFlash(bsFlash);
                                                _context9.next = 63;
                                                return _this4.flashFirmwareImpl(escIndex, escSettings, escMetainfo, bsFlash, eeprom, function (progress) {
                                                    _this4.setState({ flashingEscProgress: progress });
                                                }, true, status);

                                            case 63:
                                                _this4.state.escMetainfo[escIndex].isActivated = true;

                                            case 64:
                                                _context9.next = 66;
                                                return _this4.flashFirmwareImpl(escIndex, escSettings, escMetainfo, flash, eeprom, function (progress) {
                                                    _this4.setState({ flashingEscProgress: progress });
                                                }, isEncrypted, status);

                                            case 66:
                                                elapsedSec = (Date.now() - startTimestamp) * 1.0e-3;

                                                GUI.log(chrome.i18n.getMessage('escFlashingFinished', [escIndex + 1, elapsedSec]));
                                                googleAnalytics.sendEvent('ESC', 'FlashingFinished', 'After', elapsedSec.toString());
                                                _context9.next = 75;
                                                break;

                                            case 71:
                                                _context9.prev = 71;
                                                _context9.t9 = _context9["catch"](4);

                                                GUI.log(chrome.i18n.getMessage('escFlashingFailed', [escIndex + 1, _context9.t9.stack]));
                                                googleAnalytics.sendEvent('ESC', 'FlashingFailed', 'Error', _context9.t9.stack);

                                            case 75:

                                                _this4.setState({
                                                    flashingEscIndex: undefined,
                                                    flashingEscProgress: 0
                                                });

                                            case 76:
                                            case "end":
                                                return _context9.stop();
                                        }
                                    }
                                }, _callee9, _this4, [[4, 71]]);
                            });
                            i = 0;

                        case 6:
                            if (!(i < this.state.escsToFlash.length)) {
                                _context10.next = 11;
                                break;
                            }

                            return _context10.delegateYield(_loop4(i), "t0", 8);

                        case 8:
                            ++i;
                            _context10.next = 6;
                            break;

                        case 11:
                            _context10.next = 17;
                            break;

                        case 13:
                            _context10.prev = 13;
                            _context10.t1 = _context10["catch"](3);

                            GUI.log(chrome.i18n.getMessage('flashingFailedGeneral', [_context10.t1.stack]));
                            googleAnalytics.sendEvent('ESC', 'FirmwareValidationFailed', 'Error', _context10.t1.stack);

                        case 17:
                            _context10.next = 19;
                            return this.readSetup();

                        case 19:
                            this.setState({ isFlashing: false });

                            $('a.connect').removeClass('disabled');
                            //dialog.info("Don't forget to flash the Telemetry Service using the \"Flash All\" button");

                        case 21:
                        case "end":
                            return _context10.stop();
                    }
                }
            }, _callee10, this, [[3, 13]]);
        }));

        function flashAll(_x12, _x13) {
            return _ref9.apply(this, arguments);
        }

        return flashAll;
    }(),
    handleIgnoreMCULayout: function handleIgnoreMCULayout(e) {
        this.setState({
            ignoreMCULayout: e.target.checked
        });
    },
    render: function render() {
        if (!this.state.supportedESCs || !this.state.firmwareVersions) return null;

        return React.createElement(
            "div",
            { className: "tab-esc toolbar_fixed_bottom" },
            React.createElement(
                "div",
                { className: "content_wrapper" },
                React.createElement(
                    "div",
                    { className: this.state.noteStyle },
                    React.createElement(
                        "div",
                        { className: "note_spacer" },
                        React.createElement("p", { dangerouslySetInnerHTML: {
                                __html: chrome.i18n.getMessage(this.state.noteText) } })
                    )
                ),
                this.renderContent()
            ),
            React.createElement(
                "div",
                { className: "content_toolbar" },
                React.createElement(
                    "div",
                    { className: "btn log_btn" },
                    React.createElement(
                        "a",
                        {
                            href: "#",
                            onClick: this.saveLog
                        },
                        chrome.i18n.getMessage('escButtonSaveLog')
                    )
                ),
                React.createElement(
                    "div",
                    { className: "btn" },
                    React.createElement(
                        "a",
                        {
                            href: "#",
                            className: !this.state.selectingFirmware && !this.state.isFlashing && !this.state.licensingAll && this.state.canRead ? "" : "disabled",
                            onClick: this.readSetupHandler
                        },
                        chrome.i18n.getMessage('escButtonRead')
                    )
                ),
                React.createElement(
                    "div",
                    { className: "btn" },
                    React.createElement(
                        "a",
                        {
                            href: "#",
                            className: !this.state.selectingFirmware && !this.state.isFlashing && !this.state.licensingAll && this.state.canWrite ? "" : "disabled",
                            onClick: this.writeSetupHandler
                        },
                        chrome.i18n.getMessage('escButtonWrite')
                    )
                ),
                React.createElement(
                    "div",
                    { className: this.state.canResetDefaults ? "btn" : "hidden" },
                    React.createElement(
                        "a",
                        {
                            href: "#",
                            className: !this.state.selectingFirmware && !this.state.isFlashing && !this.state.licensingAll && this.state.canWrite ? "" : "disabled",
                            onClick: this.resetDefaultsHandler
                        },
                        chrome.i18n.getMessage('resetDefaults')
                    )
                ),
                React.createElement(
                    "div",
                    { className: "btn" },
                    React.createElement(
                        "a",
                        {
                            href: "#",
                            className: !this.state.selectingFirmware && !this.state.isFlashing && !this.state.licensingAll && this.state.canFlashTlm ? "" : "disabled",
                            onClick: this.selectFirmwareForFlashAllTlm
                        },
                        chrome.i18n.getMessage('escButtonFlashAllTlm')
                    )
                ),
                React.createElement(
                    "div",
                    { className: "btn" },
                    React.createElement(
                        "a",
                        {
                            href: "#",
                            className: !this.state.selectingFirmware && !this.state.isFlashing && !this.state.licensingAll && this.state.canFlash ? "" : "disabled",
                            onClick: this.selectFirmwareForFlashAll
                        },
                        chrome.i18n.getMessage('escButtonFlashAll')
                    )
                ),
                React.createElement(
                    "div",
                    { className: "btn" },
                    React.createElement(
                        "a",
                        {
                            href: "#",
                            className: !this.state.selectingFirmware && !this.state.isLicensed && !this.state.isL && this.props.escCount > 0 && !this.state.licensingAll && !this.state.isLocked ? "" : "disabled",
                            onClick: this.licenseAll
                        },
                        chrome.i18n.getMessage('escButtonLicenseAll')
                    )
                )
            )
        );
    },
    readSetupHandler: function readSetupHandler() {
        if (window.uiLocked) return;
        window.uiLocked = true;
        this.readSetup();
        window.uiLocked = false;
    },
    writeSetupHandler: function writeSetupHandler() {
        if (window.uiLocked) return;
        window.uiLocked = true;
        this.writeSetup();
        window.uiLocked = false;
    },
    resetDefaultsHandler: function resetDefaultsHandler() {
        if (window.uiLocked) return;
        window.uiLocked = true;
        this.resetDefaults();
        window.uiLocked = false;
    },
    renderContent: function renderContent() {
        var noneAvailable = !this.state.escMetainfo.some(function (info) {
            return info.available;
        });
        if (noneAvailable) {
            return null;
        }

        return React.createElement(
            "div",
            null,
            this.renderWrappers()
        );
    },
    loadstop: function loadstop() {
        if (this.webview.src.includes('return=1') && !this.webviewDone && this.state.licensingAll) {
            this.webview.removeEventListener('loadstop', this.lffunc);
            this.webviewDone = true;
            this.setState({
                licensingAll: false
            });
            this.readSetupHandler();
        }
    },
    renderWrappers: function renderWrappers() {
        var _this5 = this;

        if (this.state.selectingFirmware) {
            var firstAvailableIndex = this.state.escsToFlash[0];
            var firstAvailableMetainfo = this.state.escMetainfo[firstAvailableIndex];
            var firstAvailableEsc = this.state.escSettings[firstAvailableIndex];

            return [React.createElement(
                "div",
                { className: "checkbox" },
                React.createElement(
                    "label",
                    null,
                    React.createElement("input", {
                        type: "checkbox",
                        onChange: this.handleIgnoreMCULayout,
                        checked: this.state.ignoreMCULayout
                    }),
                    React.createElement(
                        "span",
                        null,
                        chrome.i18n.getMessage('escIgnoreInappropriateMCULayout'),
                        React.createElement(
                            "span",
                            {
                                className: this.state.ignoreMCULayout ? 'red' : 'hidden'
                            },
                            chrome.i18n.getMessage('escIgnoreInappropriateMCULayoutWarning')
                        )
                    )
                )
            ), React.createElement(FirmwareSelector, {
                supportedESCs: this.state.supportedESCs,
                firmwareVersions: this.state.firmwareVersions,
                signatureHint: firstAvailableMetainfo.signature,
                escHint: firstAvailableEsc.LAYOUT,
                modeHint: blheliModeToString(firstAvailableEsc.MODE),
                onFirmwareLoaded: this.onFirmwareLoaded,
                onCancel: this.onFirmwareSelectorCancel,
                selectJESC: this.state.selectJESC
            })];
        } else if (this.state.licensingAll) {
            var url = 'https://jflight.net/index.php?route=account/esc';
            for (var i = 0; i < this.props.escCount; i++) {
                url += '&uid' + (i + 1) + '=' + this.state.escMetainfo[i].uid;
            }
            return React.createElement(
                "div",
                { className: "webView" },
                React.createElement("webview", { ref: function ref(elem) {
                        if (elem != null && _this5.state.licensingAll) {
                            elem.addEventListener("loadstop", _this5.lffunc = _this5.loadstop.bind(_this5));_this5.webviewDone = false;_this5.webview = elem;
                        }
                    }, autosize: "on", src: url })
            );
        }

        return React.createElement(
            "div",
            null,
            React.createElement(
                "div",
                { className: "leftWrapper common-config" },
                this.renderCommonSettings()
            ),
            React.createElement(
                "div",
                { className: "rightWrapper individual-config" },
                this.renderIndividualSettings()
            )
        );
    },
    renderCommonSettings: function renderCommonSettings() {
        return React.createElement(CommonSettings, {
            escSettings: this.state.escSettings,
            escMetainfo: this.state.escMetainfo,
            supportedESCs: this.state.supportedESCs,
            onUserInput: this.onUserInput
        });
    },
    renderIndividualSettings: function renderIndividualSettings() {
        var _this6 = this;

        return this.state.escMetainfo.map(function (info, idx) {
            if (!info.available) {
                return null;
            }

            return React.createElement(IndividualSettings, {
                escIndex: idx,
                escSettings: _this6.state.escSettings,
                escMetainfo: _this6.state.escMetainfo,
                supportedESCs: _this6.state.supportedESCs,
                onUserInput: _this6.onUserInput,
                canFlash: !_this6.state.isFlashing && !_this6.state.licensingAll,
                canFlashTlm: !_this6.state.isFlashing && !_this6.state.licensingAll && _this6.state.escMetainfo[idx].isLicensed && _this6.state.escMetainfo[idx].isActivated && _this6.state.escMetainfo[idx].isJesc,
                isFlashing: _this6.state.flashingEscIndex === idx && _this6.state.selectJESC,
                isFlashingTlm: _this6.state.flashingEscIndex === idx && !_this6.state.selectJESC,
                progress: _this6.state.flashingEscProgress,
                onFlash: _this6.flashOne
            });
        });
    },
    onFirmwareLoaded: function onFirmwareLoaded(hex, eep) {
        this.setState({
            selectingFirmware: false
        });

        this.flashAll(hex, eep);
    },
    onFirmwareSelectorCancel: function onFirmwareSelectorCancel() {
        this.setState({
            selectingFirmware: false
        });
    }
});