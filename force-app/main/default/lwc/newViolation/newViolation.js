import { LightningElement, wire, track, api } from 'lwc';
import { createRecord, getRecord, updateRecord  } from 'lightning/uiRecordApi';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import selectUserById from '@salesforce/apex/UsersSelector.selectById';
import search from '@salesforce/apex/Lookup.search';
import sendEmailAlert from '@salesforce/apex/newViolationController.sendEmailAlert';
import getLogs from '@salesforce/apex/newViolationController.getLogs';
import VIOLATION_OBJECT from '@salesforce/schema/Violation__c';
import ID_FIELD from '@salesforce/schema/Violation__c.Id';
import MARK_FIELD from '@salesforce/schema/Violation__c.Mark__c';
import STATUS_FIELD from '@salesforce/schema/Violation__c.Status__c';
import PROOF_FIELD from '@salesforce/schema/Violation__c.Proof__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Violation__c.Description__c';
import MARKETING_PARTNER_FIELD from '@salesforce/schema/Violation__c.Marketing_Partner__c';

const FIELDS = [
    'Violation__c.Mark__c',
    'Violation__c.Status__c',
    'Violation__c.Name',
    'Violation__c.Proof__c',
    'Violation__c.Description__c',
    'Violation__c.CreatedById',
    'Violation__c.Creation_Date__c',
    'Violation__c.Marketing_Partner__r.Name',
    'Violation__c.Actions_Required__c',
    'Violation__c.UploadedFileId__c'
];

export default class NewViolation extends LightningElement {
    @api recordId;
    @api recordTypeId;
    @api isCalledFromAura;
    @api isChanged;
    @api isLoading = false;
    @api logData;

    // Mark__c field
    @api markCurrent = '';
    @api markPrevious = '';
    @track markOptions;
    
    // Status__c field
    @track statusOptions;
    @api statusCurrent;
    @api statusPrevious;

    // Description__c field
    @api descriptionCurrent = '';
    @api descriptionPrevious = '';

    // Proof__c field
    @api proofCurrent = '';
    @api proofPrevious = '';

    // Marketing_Partner__c field
    @api marketingPartnerNameCurrent;
    @api marketingPartnerNamePrevious;
    @api marketingPartnerIdCurrent;
    @api marketingPartnerIdPrevious;
    @track marketingPartnersOptions;

    // Other fields
    @api nameValue;
    @api actionsRequired;
    @api createdByIdValue;
    @api creationDateValue;
    @api createdByNameValue;
    @track uploadedContent = [];

    // css
    @api dropdownStyle = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    @api boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';

    get recordActionType() {
        return this.isCalledFromAura ? this.recordId ? 'edit' : 'create' : 'view';
    }
    get showHeader() {
        return this.recordActionType !== 'create'
    }
    get showSendAlert() {
        return this.recordActionType === 'view'
    }
    get showFooter() {
        return this.recordActionType === 'view'
    }
    get showSaveCancel() {
        return this.recordActionType !== 'view' || this.isChanged
    }
    get showActionsRequired() {
        return this.recordActionType === 'view' || !this.isChanged
    }
    get saveButtonValue() {
        return !this.recordId ? 'Create' : 'Save';
    } 
    get isButtonDisabled() {
        if (this.isChanged ||
            this.markCurrent === 'Green' ||
            this.markCurrent === 'Yellow+Complaint' ||
            this.markCurrent === 'Red+Complaint' ||
            this.markCurrent === 'Orange+Complaint' ||
            this.markCurrent === 'Black+Complaint') {
            return true
        }
        return false
    }
    get inputStyleMark() {
        return this.markCurrent ? 
            `slds-input slds-combobox__input ${/\w+/.exec(this.markCurrent.toLowerCase())[0]}` :
            'slds-input slds-combobox__input'
    }

    logColumns = [
        { label: 'Time', fieldName: 'time', type: 'date', 
            typeAttributes:{
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
        }},
        { label: 'Perfomed by', fieldName: 'perfomedBy' },
        { label: 'Action', fieldName: 'action' },
        { label: 'Details', fieldName: 'details' },
    ]

    @wire(getObjectInfo, { objectApiName: VIOLATION_OBJECT })
    getDefaultRecordType( {data, error} ){
       if(data){
         this.recordTypeId = data.defaultRecordTypeId;
       }else if(error){
        console.log('Error fetching default record type:');
        console.log(error)
        }
     };


    wiredViolation
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wireViolation(value) {
        this.wiredViolation = value;
        const {error, data} = value;
        console.log(data)
        if (data) {
            this.markCurrent = data.fields.Mark__c.value; 
            this.markPrevious = data.fields.Mark__c.value; 
            this.statusCurrent = data.fields.Status__c.value;
            this.statusPrevious = data.fields.Status__c.value;
            this.actionsRequired = data.fields.Actions_Required__c.value;
            if(data.fields.Description__c.value) {
                this.descriptionCurrent = data.fields.Description__c.value;
                this.descriptionPrevious = data.fields.Description__c.value;
            } else {
                this.descriptionCurrent = '';
                this.descriptionPrevious = '';
            }
            if(data.fields.Proof__c.value) {
                this.proofCurrent = data.fields.Proof__c.value;
                this.proofPrevious = data.fields.Proof__c.value;
            } else {
                this.proofCurrent = '';
                this.proofPrevious = '';
            }
            if(data.fields.Marketing_Partner__r.value) {
                this.marketingPartnerNameCurrent = data.fields.Marketing_Partner__r.displayValue;
                this.marketingPartnerNamePrevious = data.fields.Marketing_Partner__r.displayValue;
                this.marketingPartnerIdCurrent = data.fields.Marketing_Partner__r.value.id;
                this.marketingPartnerIdPrevious = data.fields.Marketing_Partner__r.value.id;
                this.isValueSelected = true;
            }
            this.nameValue = data.fields.Name.value;
            this.createdByIdValue = data.fields.CreatedById.value;
            this.creationDateValue = data.fields.Creation_Date__c.displayValue;
            if(data.fields.UploadedFileId__c.value) {
                // parse string
                this.uploadedContent = data.fields.UploadedFileId__c.value.split('*').filter( i => !!i).map(i => {
                    const obj = {};
                    i.replaceAll('ContentDocWrapp:[','').replaceAll(']','').replaceAll(', ',',').split(',').forEach(j => {
                    obj[j.slice(0, j.indexOf('='))] = j.slice(j.indexOf('=')+1, j.length)
                    })

                    //convert time from gmt to current
                    const currentTime =new Date(Date.parse(obj.CreatedDate)-new Date().getTimezoneOffset()*60000);
                    obj.CreatedDate = currentTime;
                    return obj
                })
            }
        } else if (error) {
            console.log('Error fetching record info:');
            console.log(error)
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: 'Violation__c.Mark__c'})
    getMarkOptions({ data, error }) {
        if (data) {
            this.markOptions = data.values.map(i => {
                return {
                    label: i.label,
                    value: i.value,
                    // for optional styling
                    class: `palette ${/\w+/.exec(i.label.toLowerCase())[0]}`
                };
            });
        } else if (error) {
            console.log('Error fetching mark options:');
            console.log(error)
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: 'Violation__c.Status__c'})
    getStatusOptions({ data, error }) {
        if (data) {
            this.statusOptions = data.values.map(i => {
                return {
                    label: i.label,
                    value: i.value,
                };
            });

        } else if (error) {
            console.log('Error fetching status options:');
            console.log(error)
        }
    }

    @wire(selectUserById, { id: '$createdByIdValue' })
    getUserName({ data, error }) {
        if (data) {
            this.createdByNameValue = data[0].Name
        } else if (error) {
            console.log('Error while fetching user`s Name by id');
            console.log(error)
        }
    }

    // Mark field section
    changeMark(e) {
        if(!e.target.classList.contains('slds-combobox__input')) {
            this.markCurrent = e.target.getAttribute('title');
        }
        if(!e.currentTarget.classList.contains('slds-is-open')) {
            this.dropdownStyle = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open';
        }
        if(this.markCurrent !== this.markPrevious) {
            this.isChanged = true;
        } else {
            this.isChanged = false;
        }
    }

    blurMark(e) {
        setTimeout(() => {
            this.dropdownStyle = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
        }, 300);
    }

    // Status field section
    changeStatus(e) {
        this.statusCurrent = e.detail.value;
        if(this.statusCurrent !== this.statusPrevious) {
            this.isChanged = true;
        } else {
            this.isChanged = false;
        }
    }

    // Description field section
    descriptionFocus
    focusDescription(e) {
        this.descriptionFocus = true;
    }
    changeDescription(e) {
        this.descriptionCurrent = e.detail.value;
        console.log('triggered change description')
        if(this.descriptionFocus) {
            if(this.descriptionCurrent !== this.descriptionPrevious) {
                this.isChanged = true;
            } else {
                this.isChanged = false;
            }
        }
    }
    focusOutDescription(e) {
        this.descriptionFocus = false;
    }

    // Proof field section
    proofFocus
    focusProof(e) {
        this.proofFocus = true;
    }
    changeProof(e) {
        this.proofCurrent = e.detail.value;
        if(this.proofFocus) {
            if(this.proofCurrent !== this.proofPrevious) {
                this.isChanged = true;
            } else {
                this.isChanged = false;
            }
        }
    }
    focusOutProof(e) {
        this.proofFocus = false;
    }


    // Marketing Partner lookup section
    @api filter = '';
    @api isValueSelected;
    @api blurTimeout;
    @api searchTerm = '';   
    @wire(search, {searchTerm : '$searchTerm', myObject : "Marketing_Partner__c", filter : '$filter'})
    wiredRecords({ error, data }) {
        if (data) {
            this.marketingPartnersOptions = data;
        } else if (error) {
            console.log('Error while fetching marketing partner options');
            console.log(error)
        }
    }
    connectedCallback() {   
    }
    handleClick() {
        console.log('click')
        this.inputStyleMarketingPartner = 'slds-has-focus';
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
    }   
    onBlur() {
        console.log('blur')
        this.blurTimeout = setTimeout(() =>  {
            console.log('blured')
            this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus'
        }, 300);
    }   
    onSelect(event) {
        console.log('select')
        this.isValueSelected = true;
        this.marketingPartnerIdCurrent = event.currentTarget.dataset.id;
        this.marketingPartnerNameCurrent = event.currentTarget.dataset.name;
        if(this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
        if(this.marketingPartnerNameCurrent !== this.marketingPartnerNamePrevious) {
            this.isChanged = true;
        } else {
            this.isChanged = false;
        }
    }   
    handleRemovePill() {
        console.log('remove pill')
        this.isValueSelected = false;
        this.marketingPartnerIdCurrent = null;
        this.marketingPartnerNameCurrent = null;
        this.searchTerm = '';
        if(this.marketingPartnerNameCurrent !== this.marketingPartnerNamePrevious) {
            this.isChanged = true;
        } else {
            this.isChanged = false;
        }
    }   
    onSearchChange(event) {
        this.searchTerm = event.target.value;
    }


    // save/discard record`s changes section
    upsertViolation() {
        // check for required fields
        if(this.markCurrent && this.statusCurrent && this.marketingPartnerIdCurrent) {
            this.isLoading = true;
            const fields = {
                [ID_FIELD.fieldApiName]: this.recordId,
                [MARK_FIELD.fieldApiName]: this.markCurrent,
                [STATUS_FIELD.fieldApiName]: this.statusCurrent,
                [PROOF_FIELD.fieldApiName]: this.proofCurrent,
                [DESCRIPTION_FIELD.fieldApiName]: this.descriptionCurrent,
                [MARKETING_PARTNER_FIELD.fieldApiName]: this.marketingPartnerIdCurrent
            };
            if(this.recordId) {
                //update existing record
                fields[ID_FIELD.fieldApiName] = this.recordId;
                const recordInput = { fields };
                updateRecord(recordInput)
                    .then( () => {
                        this.isLoading = false;
                        this.isChanged = false;
                        this.statusPrevious = this.statusCurrent;
                        this.markPrevious = this.markCurrent;
                        this.descriptionPrevious = this.descriptionCurrent;
                        this.proofPrevious = this.proofCurrent;
                        this.marketingPartnerIdPrevious = this.marketingPartnerIdCurrent;
                        this.marketingPartnerNamePrevious = this.marketingPartnerNameCurrent;
                        this.dispatchEvent(new CustomEvent('close'));
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Violation updated',
                                variant: 'success',
                            }),
                        );
                    })
                    .catch(error => {
                        this.isLoading = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error updating record',
                                message: error.body.message,
                                variant: 'error',
                            }),
                        );
                    });
            } else {
                //insert new record
                const recordInput = { apiName: VIOLATION_OBJECT.objectApiName, fields };
                createRecord(recordInput)
                    .then( () => {
                        this.isLoading = false;
                        this.isChanged = false;
                        this.dispatchEvent(new CustomEvent('close'));
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Violation created',
                                variant: 'success',
                            }),
                        );
                    })
                    .catch(error => {
                        this.isLoading = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error creating record',
                                message: error.body.message,
                                variant: 'error',
                            }),
                        );
                    });
            } 
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: 'Fields Mark, Status and Marketing Partner are required.',
                    variant: 'error',
                }),
            ); 
        }
    }
    cancel() {
        if(this.recordActionType !== "view") { 
            this.dispatchEvent(new CustomEvent('close'));
        }
        this.statusCurrent = this.statusPrevious;
        this.markCurrent = this.markPrevious;
        this.descriptionCurrent = this.descriptionPrevious;
        this.proofCurrent = this.proofPrevious;
        this.marketingPartnerIdCurrent = this.marketingPartnerIdPrevious;
        this.marketingPartnerNameCurrent = this.marketingPartnerNamePrevious;
        if(this.marketingPartnerIdPrevious) {
            this.isValueSelected = true;
        }
        this.isChanged = false;
    }

    // send email alert section
    sendAlert() {
        sendEmailAlert({recordId: this.recordId})
        .then( () => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Email is sent',
                    variant: 'success',
                }),
            );
        })
        .catch(error => {
            console.log('Error sending mail:');
            console.log(error)
        });
    }


    // Logs modal pop up section
    handlePopup() {
        this.isLoading = true;
        refreshApex(this.wiredViolation)

        // update content files information
        if(this.wiredViolation.data.fields.UploadedFileId__c.value) {
            // parse string
            this.uploadedContent = this.wiredViolation.data.fields.UploadedFileId__c.value.split('*').filter( i => !!i).map(i => {
                const obj = {};
                i.replaceAll('ContentDocWrapp:[','').replaceAll(']','').replaceAll(', ',',').split(',').forEach(j => {
                obj[j.slice(0, j.indexOf('='))] = j.slice(j.indexOf('=')+1, j.length)
                })

                //convert time from gmt to current
                const currentTime =new Date(Date.parse(obj.CreatedDate)-new Date().getTimezoneOffset()*60000);
                obj.CreatedDate = currentTime;
                return obj
            })
        }
        
        getLogs({recordId: this.recordId})
        .then(data => {
            const creationInfo = {};
            const historyArray  = data.map(i => {
                const action = i.Field.replaceAll('__c', '').replaceAll('_', ' ');
                const result = {
                    time: i.CreatedDate,
                    perfomedBy: i.CreatedBy.Name,
                    action: action
                }
                if (action == 'Status' || action == 'Mark' || action == 'Marketing Partner') {
                    result.details = `${i.OldValue} => ${i.NewValue}`;
                    return result
                }
                if(action == 'Description') {
                    result.details = 'Description was changed';
                    return result
                }
                if(action == 'Proof') {
                    result.details = 'Proof was changed';
                    return result
                }
                if (action == 'Name') {
                    creationInfo.time = i.CreatedDate,
                    creationInfo.perfomedBy = i.CreatedBy.Name,
                    creationInfo.action = action,
                    creationInfo.details = `Created with Name: №${i.NewValue}`
                }
            }).filter( i => !!i )

            // add information from Uploaded content array
            this.uploadedContent.forEach( i => {
                if(i.Action === 'Create') {
                    historyArray.push({
                        time: i.CreatedDate,
                        perfomedBy: i.CreateBy,
                        action: 'Content',
                        details: `Uploaded file: ${i.Title}`
                    })
                } else {
                    historyArray.push({
                        time: i.CreatedDate,
                        perfomedBy: i.CreateBy,
                        action: 'Content',
                        details: `Deleted file: ${i.Title}`
                    })
                }
            })
            this.logData = historyArray.sort( (a, b) => {
                return new Date(b.time) - new Date(a.time)
            })
            this.logData.push(creationInfo)
        })
        .catch(error => {
            console.log('Error while fetching log data:');
            console.log(error)
        });
        this.template.querySelector("section").classList.remove("slds-hide");
        this.template
        .querySelector("div.modalBackdrops")
        .classList.remove("slds-hide");
        this.isLoading = false;
    }
  
    handleSkip() {
      this.template.querySelector("section").classList.add("slds-hide");
      this.template
        .querySelector("div.modalBackdrops")
        .classList.add("slds-hide");
    }
}