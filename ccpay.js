"use strict";

var ccpay = (function() {


    const apiKey = "T14199_PUB_xvpt6bumyaqjakzarbqtrtuw2qn4mutnesmf9xgjkdgmdtwjhin2mu9u6z6w";
    // const apiEndPoint = "http://localhost/api/cp/donation";
    const apiEndPoint = "https://devtest.mentonegirls.vic.edu.au/api/cp/donation";

    let creditCardFrame = null;
    let wrapperHTMLId = null;
    const creditCardDivId = `ccp-id-${(new Date()).getMilliseconds()}-${Math.round(Math.random() * 10)}`;
    const btnId = `btn-id-${(new Date()).getMilliseconds()}-${Math.round(Math.random() * 10)}`;
    const initError = {
        message: '',
        errors: {}
    };
    const msg = `For any queries regarding your donation, please do not hesitate to contact Roslyn Holloway, Advancement Manager (<a href="mailto:rholloway@mentonegirls.vic.edu.au">rholloway@mentonegirls.vic.edu.au</a> / <a href="tel:+61 3 9581 1263">9581 1263</a>`;
    const initialData = {
        submitting: undefined,
        first_name: '',
        is_anonymous: false,
        last_name: '',
        amount: '',
        email: '',
        phone: '',
        donation_direction: '',
        address: {
            street: '',
            city: '',
            state: '',
            postcode: '',
        },
    };
    const formData = Object.assign({}, initialData);
    const errorData = Object.assign({}, initError);

    const setBtnToLoading = () => {
        $(`#${btnId}`).attr("disabled", true).find('.loading-icon').show();
        formData.submitting = true;
    };
    const setBtnToInitial = () => {
        $(`#${btnId}`).removeAttr("disabled").find('.loading-icon').hide();
        formData.submitting = false;
    };
    /**
     *
     */
    const reloadForm = (hardReload) => {
        if (hardReload !== true) {
            $('.data-input', $(`#${wrapperHTMLId}`)).trigger('change');
            return;
        }
        if (creditCardFrame !== undefined && creditCardFrame !== null) {
            creditCardFrame.destroy();
            creditCardFrame = null;
        }
        $('#' + wrapperHTMLId).replaceWith(getForm())
            .ready(() => {
                initPaymentDiv(creditCardDivId)
            });
    };

    const showSuccessMessage = () => {
        const msgDiv = $('<div class="alert alert-success" />')
            .append($('<h3 class="alert-heading"/>').append('Thank you!'))
            .append($('<p />').append(`Thank you very much for your kind donation to the School.`))
            .append($('<p />').append(msg))
        $('#' + wrapperHTMLId).replaceWith($('<div class="container-fluid" />').append(msgDiv));
    };

    const tokenCallback = (err, data) => {
        if (err) {
            alert('Error Occurred when connecting payment gateway, please refresh page and try again.');
            setBtnToInitial();
        } else {
            $.post(apiEndPoint, {
                ...formData,
                cc: data,
                amount: parseFloat(`${formData.amount}`.replace(/[^0-9.-]+/g, ""))
            }, (res) => {
                if (res.success === true) {
                    showSuccessMessage();
                }
            }, 'json')
                .fail(err => {
                    const error = (err.responseJSON || err);
                    alert(`Error Occurred: ${error.message || ''}`);
                    reloadForm(true);
                })
                .always(() => {
                    setBtnToInitial();
                })

        }
        creditCardFrame.destroy();
        creditCardFrame = null;
    };

    const createdCallback = (err, frame) => {
        if (err) {
            alert('Error Occurred when connecting payment gateway, please refresh page and try again.');
        } else {
            // Save the created frame for when we get the token
            creditCardFrame = frame;
        }
    };

    const initPaymentDiv = (creditCardDivId) => {
        const options = {
            container: creditCardDivId,
            publishableApiKey: apiKey,
            tokenMode: "callback",
            onValid: function () {
                $(`#${btnId}`).removeAttr("disabled")
            },
            onInvalid: function () {
                $(`#${btnId}`).attr('disabled', true)
            }
        };
        payway.createCreditCardFrame(options, createdCallback)
    };

    const validateEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const validateAmount = (amount) => {
        const re = /(?=.*?\d)^\$?(([1-9]\d{0,2}(,\d{3})*)|\d+)?(\.\d{1,2})?$/;
        return re.test(amount);
    };

    const isFieldValid = (fieldName, isCompulsory) => {
        if (isCompulsory === true && (!formData[fieldName] || formData[fieldName] === '')) {
            errorData.errors[fieldName] = [`${fieldName} is required!`];
            return false;
        }

        if (fieldName === 'email' && validateEmail(formData[fieldName]) !== true) {
            errorData.errors[fieldName] = [`${fieldName} is not valid email address!`];
            return false;
        }

        if (fieldName === 'amount' && (validateAmount(formData[fieldName]) !== true || parseFloat(formData[fieldName]) === 0)) {
            errorData.errors[fieldName] = [`${fieldName} is not valid number!`];
            return false;
        }

        if (fieldName in errorData.errors) {
            delete errorData.errors[fieldName];
        }
        return true;
    };

    const submitForm = (e) => {
        setBtnToLoading();
        const keys = Object.keys(errorData.errors);
        if (keys.length > 0) {
            $(`#${keys[0]}`).focus();
            setBtnToInitial();
            reloadForm();
            return;
        }
        creditCardFrame.getToken(tokenCallback);
    };

    const getFieldset = (labelDiv, control, inputId, isCompulsory) => {
        const isValid = isFieldValid(inputId, isCompulsory);
        const formGroup = $('<div class="form-group" />');
        if (labelDiv) {
            formGroup.append(labelDiv);
        }
        if (control) {
            formGroup.append(control);
        }
        if (isValid !== true && formData.submitting !== undefined && errorData.errors[inputId] !== undefined) {
            control.css('border', '1px red solid');
            formGroup.append($('<div class="text-danger" />').append(errorData.errors[inputId].join('')));
        }
        return formGroup;
    };

    const handleValueChanged = (e, fieldName, newValue) => {
        formData.submitting = false;
        formData[fieldName] = newValue;
        let newDiv = null;
        const element = $(e.target);
        if (e.target.type.toLowerCase() === 'text') {
            newDiv = getInput(
                (element.data('label') || undefined),
                element.data('inputId'),
                element.data('placeholder'),
                (element.data('isCompulsory') === true)
            );
        } else if (e.target.type.toLowerCase().startsWith('select')) {
            newDiv = getDropdown(
                (element.data('label') || undefined),
                element.data('inputId'),
                element.data('placeholder'),
                (element.data('isCompulsory') === true),
                element.data('options')
            );
        }
        if (newDiv !== null) {
            $(e.target).parent().replaceWith(newDiv);
        }
    };

    const getInput = (label, inputId, placeholder, isCompulsory) => {
        let labelDiv = null;
        const value = (formData[inputId] ? formData[inputId] : '');
        const inputDiv = $(`<input type="text" class="form-control input-large data-input" id="${inputId}" placeholder="${placeholder}" value="${value}" />`)
            .data({label: label, placeholder: placeholder, isCompulsory: isCompulsory, inputId: inputId, type: 'input'})
            .change((e) => {
                handleValueChanged(e, inputId, e.target.value)
            });
        if (label) {
            labelDiv = $('<label class="control-label"/>').append(label);
            if (isCompulsory === true) {
                labelDiv.append($('<span class="text-danger" />').append('*'))
            }
            inputDiv.attr('data-label', label);
        }
        return getFieldset(labelDiv, inputDiv, inputId, isCompulsory);
    };

    const getCheckbox = (label, inputId) => {
        let labelDiv = null;
        if (label) {
            labelDiv = $('<label class="control-label"/>')
                .append(label)
                .append(
                    $('<input type="checkbox" class="data-input"/>')
                        .css('margin-left', '10px')
                        .attr('checked', formData[inputId] === true)
                        .data({label: label, inputId: inputId, type: 'checkbox'})
                        .change(e => {
                            handleValueChanged(e, inputId, e.target.checked)
                        })
                );
        }
        return getFieldset(labelDiv, undefined, inputId);
    };

    const getDropdown = (label, inputId, placeholder, isCompulsory, options = {}) => {
        let labelDiv = null;
        const inputDiv = $(`<select type="text" class="form-control input-large data-input" />`)
            .data({
                label: label,
                placeholder: placeholder,
                isCompulsory: isCompulsory,
                options: options,
                inputId: inputId,
                type: 'select'
            })
            .change((e) => {
                handleValueChanged(e, inputId, e.target.value)
            });
        inputDiv.append($(`<option value="" disabled>${placeholder}</option>`).attr('selected', (!formData[inputId] || formData[inputId] === '')));
        Object.keys(options).map(key => {
            inputDiv.append($(`<option value="${key}" ${(formData[inputId] && formData[inputId] === key) ? 'selected' : ''}>${options[key]}</option>`));
        });
        if (label) {
            labelDiv = $('<label class="control-label"/>').append(label);
            if (isCompulsory === true) {
                labelDiv.append($('<span class="text-danger" />').append('*'))
            }
            inputDiv.attr('data-label', label);
        }
        return getFieldset(labelDiv, inputDiv, inputId, isCompulsory);
    };

    const getAddressFieldset = (label) => {
        return $('<div class="form-group address" />')
            .append($('<label class="control-label"/>').append(label))
            .append($('<div class="row" />').append(
                $('<div class="col" />').append(
                    getInput(undefined, 'address_street', 'Street Address, ex: 123 some street')
                )
            ))
            .append($('<div class="row" />')
                .append(
                    $('<div class="col-md-4" />').append(
                        getInput(undefined, 'address_city', 'City / Suburb')
                    )
                ).append(
                    $('<div class="col-md-4" />').append(
                        getInput(undefined, 'address_state', 'State / Province')
                    )
                ).append(
                    $('<div class="col-md-4" />').append(
                        getInput(undefined, 'address_postcode', 'Postcode / ZipCode')
                    )
                )
            );
    };


    const getForm = () => {
        return $('<div class="container-fluid" />')
            .append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append(
                        $(`<div class="alert alert-light"/>`).append(msg)
                    )
                )
            )
            .append(
                $('<div class="row" />').append(
                    $('<div class="col-sm-6" />').append(getInput('First Name', 'first_name', 'First Name', true))
                ).append(
                    $('<div class="col-sm-6" />').append(getInput('Last Name', 'last_name', 'Last Name', true))
                )
            ).append(
                $('<div class="row" />').append(
                    $('<div class="col-sm-6" />').append(getInput('Email', 'email', 'ex: myname@example.com', true))
                ).append(
                    $('<div class="col-sm-6" />').append(getInput('Phone Number', 'phone', 'ex: +61 3 1234 4567 or 0432 343 123', true))
                )
            )
            .append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append(getAddressFieldset('Address: '))
                )
            ).append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append(getInput('Donation Amount', 'amount', 'The amount of your donation, ex: $100', true))
                )
            ).append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append($('<div class="alert alert-light"/>').append('Please note: All donations greater than $2 are tax deductible.'))
                )
            ).append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append(getDropdown('Please direct my donations to', 'donation_direction', 'Please select...', true,
                        {'Scholarship Fund': 'Scholarship Fund', 'Building Fund': 'Building Fund', 'Library': 'Library'}
                    ))
                )
            ).append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append(getCheckbox('I wish for my donation to remain anonymous', 'is_anonymous'))
                )
            )
            .append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append(
                        $('<div class="form-group" />').append(
                            $('<div class="credit-card" id="' + creditCardDivId + '"/>')
                        )
                    )
                )
            )
            .append(
                $('<div class="row" />').append(
                    $('<div class="col" />').append(
                        $(`<Button class="btn btn-primary btn-lg" id="${btnId}" disabled/>`)
                            .append($('<i class="fas fa-spinner fa-pulse loading-icon" />').css('display', 'none'))
                            .append(' Submit')
                            .click((e) => submitForm(e))
                    )
                )

            )
            .wrap($('<div class="form" />'));
    };

    const postInit = (id) => {
        $('head').append(
            $('<link>')
                .attr({
                    type: 'text/css',
                    rel: 'stylesheet',
                    href: 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
                })
        ).append($('<link>')
            .attr({
                type: 'text/css',
                rel: 'stylesheet',
                href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.min.css',
                integrity:"sha512-1PKOgIY59xJ8Co8+NE6FZ+LOAZKjy+KY8iq0G4B3CyeY6wYHN3yt9PW0XpSriVlkMXe40PTKnXrLnZ9+fkDaog==",
                crossorigin: "anonymous",
            })
        );
        $.getScript('https://api.payway.com.au/rest/v1/payway.js', () => {
            wrapperHTMLId = id;
            $('#' + id)

                .append(getForm())
                .ready(() => {
                    initPaymentDiv(creditCardDivId)
                });
        });
    };

    const init = function (id) {
        if(typeof jQuery=='undefined') {
            var headTag = document.getElementsByTagName("head")[0];
            var jqTag = document.createElement('script');
            jqTag.type = 'text/javascript';
            jqTag.src = 'https://code.jquery.com/jquery-3.5.1.min.js';
            jqTag.onload = () => {postInit(id)};
            headTag.appendChild(jqTag);
        } else {
            postInit(id);
        }

    };

    return {
        initPayDiv: init
    }

}());
