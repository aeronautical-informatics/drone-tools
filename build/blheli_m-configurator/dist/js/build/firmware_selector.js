'use strict';

// Fix for nw.js which has regeneratorRuntime defined in global.

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

if (window.regeneratorRuntime == undefined) {
    window.regeneratorRuntime = global.regeneratorRuntime;
}

var FirmwareSelector = React.createClass({
    displayName: 'FirmwareSelector',

    getInitialState: function getInitialState() {
        var escHint = this.props.escHint;

        var selectedEsc;
        if (this.props.supportedESCs.layouts[BLHELI_TYPES.BLHELI_S_SILABS].hasOwnProperty(escHint) || this.props.supportedESCs.layouts[BLHELI_TYPES.SILABS].hasOwnProperty(escHint) || this.props.supportedESCs.layouts[BLHELI_TYPES.ATMEL].hasOwnProperty(escHint)) {
            selectedEsc = escHint;
        }

        var type;
        if (findMCU(this.props.signatureHint, this.props.supportedESCs.signatures[BLHELI_TYPES.BLHELI_S_SILABS])) {
            type = BLHELI_TYPES.BLHELI_S_SILABS;
        } else if (findMCU(this.props.signatureHint, this.props.supportedESCs.signatures[BLHELI_TYPES.SILABS])) {
            type = BLHELI_TYPES.SILABS;
        } else if (findMCU(this.props.signatureHint, this.props.supportedESCs.signatures[BLHELI_TYPES.ATMEL])) {
            type = BLHELI_TYPES.ATMEL;
        } else {
            throw new Error('Unknown MCU signature: ' + this.props.signatureHint.toString(0x10));
        }

        return {
            selectedEsc: selectedEsc,
            selectedMode: this.props.modeHint,
            selectedVersion: -1,
            selectedUrl: null,
            type: type
        };
    },
    render: function render() {
        return React.createElement(
            'div',
            { className: 'centerWrapper' },
            React.createElement(
                'div',
                { className: 'gui_box grey' },
                React.createElement(
                    'div',
                    { className: 'gui_box_titlebar' },
                    React.createElement(
                        'div',
                        { className: 'spacer_box_title' },
                        'Select Target'
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'spacer_box' },
                    this.renderEscSelect(),
                    this.renderModeSelect(),
                    this.renderVersionSelect(),
                    React.createElement(
                        'div',
                        { className: 'default_btn' },
                        React.createElement(
                            'a',
                            {
                                href: '#',
                                className: this.state.selectedEsc && (this.state.type === BLHELI_TYPES.BLHELI_S_SILABS || this.state.selectedMode) && this.state.selectedVersion !== -1 ? "" : "disabled",
                                onClick: this.onlineFirmwareSelected
                            },
                            chrome.i18n.getMessage('escButtonSelect')
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'default_btn' },
                        React.createElement(
                            'a',
                            {
                                href: '#',
                                onClick: this.localFirmwareSelected
                            },
                            chrome.i18n.getMessage('escButtonSelectLocally')
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'default_btn' },
                        React.createElement(
                            'a',
                            {
                                href: '#',
                                onClick: this.props.onCancel
                            },
                            chrome.i18n.getMessage('buttonCancel')
                        )
                    )
                )
            )
        );
    },
    renderEscSelect: function renderEscSelect() {
        var description = this.props.supportedESCs.layouts[this.state.type];

        var escs = [React.createElement(
            'option',
            { className: 'hidden', disabled: true, selected: true },
            'Select ESC'
        )];

        for (var layout in description) {
            if (description.hasOwnProperty(layout)) {
                var ESC = description[layout];
                escs.push(React.createElement(
                    'option',
                    { value: layout },
                    ESC.name
                ));
            }
        }

        return React.createElement(
            'div',
            { className: 'select' },
            React.createElement(
                'label',
                null,
                React.createElement(
                    'select',
                    { onChange: this.escSelected, value: this.state.selectedEsc },
                    escs
                ),
                React.createElement(
                    'span',
                    null,
                    'ESC'
                )
            )
        );
    },
    renderModeSelect: function renderModeSelect() {
        // Display only for BLHeli
        if (this.state.type !== BLHELI_TYPES.BLHELI_S_SILABS) {
            var modes = [React.createElement(
                'option',
                { className: 'hidden', disabled: true, selected: true },
                'Select Mode'
            )];

            for (var mode in BLHELI_MODES) {
                if (BLHELI_MODES.hasOwnProperty(mode)) {
                    modes.push(React.createElement(
                        'option',
                        { value: mode },
                        mode
                    ));
                }
            }

            return React.createElement(
                'div',
                { className: 'select' },
                React.createElement(
                    'label',
                    null,
                    React.createElement(
                        'select',
                        { onChange: this.modeSelected, value: this.state.selectedMode },
                        modes
                    ),
                    React.createElement(
                        'span',
                        null,
                        'Mode'
                    )
                )
            );
        }
    },
    renderVersionSelect: function renderVersionSelect() {
        var _this = this;

        var versions = this.props.firmwareVersions[this.state.type];

        var options = [];
        versions.forEach(function (version, idx) {
            if (version.multishot && _this.state.selectedMode !== blheliModeToString(BLHELI_MODES.MULTI)) {
                return;
            }

            options.push(React.createElement(
                'option',
                { value: idx },
                version.name
            ));
        });

        return React.createElement(
            'div',
            { className: 'select' },
            React.createElement(
                'label',
                null,
                React.createElement(
                    'select',
                    { onChange: this.versionSelected, value: this.state.selectedVersion },
                    React.createElement(
                        'option',
                        { className: 'hidden', disabled: true, selected: true, value: '-1' },
                        'Select Version'
                    ),
                    options
                ),
                React.createElement(
                    'span',
                    null,
                    'Version'
                )
            )
        );
    },
    escSelected: function escSelected(e) {
        this.setState({
            selectedEsc: e.target.value
        });
    },
    modeSelected: function modeSelected(e) {
        this.setState({
            selectedMode: e.target.value,
            selectedVersion: -1
        });
    },
    versionSelected: function versionSelected(e) {
        this.setState({
            selectedVersion: e.target.value
        });
    },
    onlineFirmwareSelected: function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            var versions, version, escs, url, cacheKey, hex, eep;
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            versions = this.props.firmwareVersions[this.state.type];
                            version = versions[this.state.selectedVersion];
                            escs = this.props.supportedESCs.layouts[this.state.type];

                            // @todo this replace-based conversion does not work for some ESC files, add a lookup table

                            url = version.url.format(escs[this.state.selectedEsc].name.replace(/[\s-]/g, '_').toUpperCase(), this.state.selectedMode);
                            cacheKey = this.state.type === BLHELI_TYPES.BLHELI_S_SILABS ? version.key + '_' + this.state.selectedEsc : version.key + '_' + this.state.selectedEsc + '_' + this.state.selectedMode;
                            _context.prev = 5;
                            _context.next = 8;
                            return getFromCache(cacheKey, url);

                        case 8:
                            hex = _context.sent;

                            if (!(this.state.type === BLHELI_TYPES.ATMEL)) {
                                _context.next = 13;
                                break;
                            }

                            _context.next = 12;
                            return getFromCache(cacheKey + 'EEP', url.replace('Hex files', 'Eeprom files').replace('.HEX', '.EEP'));

                        case 12:
                            eep = _context.sent;

                        case 13:

                            googleAnalytics.sendEvent('ESC', 'RemoteFirmwareLoaded', cacheKey);

                            if (!Debug.enabled) {
                                _context.next = 17;
                                break;
                            }

                            console.log('loaded hex', hex.length, eep ? 'eep ' + eep.length : '');
                            return _context.abrupt('return');

                        case 17:

                            this.props.onFirmwareLoaded(hex, eep);
                            _context.next = 24;
                            break;

                        case 20:
                            _context.prev = 20;
                            _context.t0 = _context['catch'](5);

                            GUI.log('Could not load firmware for {0} {1} {2}: <span style="color: red">{3}</span>'.format(escs[this.state.selectedEsc].name, this.state.selectedMode, version.name, _context.t0.message));

                            googleAnalytics.sendEvent('ESC', 'RemoteFirmwareLoadFailed', version.key);

                        case 24:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this, [[5, 20]]);
        }));

        function onlineFirmwareSelected() {
            return _ref.apply(this, arguments);
        }

        return onlineFirmwareSelected;
    }(),
    localFirmwareSelected: function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            var hex, eep;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            _context2.prev = 0;
                            _context2.next = 3;
                            return selectFile('hex');

                        case 3:
                            hex = _context2.sent;

                            if (!(this.state.type === BLHELI_TYPES.ATMEL)) {
                                _context2.next = 8;
                                break;
                            }

                            _context2.next = 7;
                            return selectFile('eep');

                        case 7:
                            eep = _context2.sent;

                        case 8:

                            googleAnalytics.sendEvent('ESC', 'LocalFirmwareLoaded');

                            this.props.onFirmwareLoaded(hex, eep);
                            _context2.next = 15;
                            break;

                        case 12:
                            _context2.prev = 12;
                            _context2.t0 = _context2['catch'](0);

                            GUI.log('Could not load local firmware: ' + _context2.t0.message);

                        case 15:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this, [[0, 12]]);
        }));

        function localFirmwareSelected() {
            return _ref2.apply(this, arguments);
        }

        return localFirmwareSelected;
    }()
});