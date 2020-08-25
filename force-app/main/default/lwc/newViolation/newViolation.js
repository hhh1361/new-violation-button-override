import { LightningElement, wire, track, api } from 'lwc';
import { createRecord, getRecord, updateRecord  } from 'lightning/uiRecordApi';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import selectById from '@salesforce/apex/UsersSelector.selectById';
import search from '@salesforce/apex/Lookup.search';
import sendEmailAlert from '@salesforce/apex/newViolationController.sendEmailAlert';
import getLogs from '@salesforce/apex/newViolationController.getLogs';
import VIOLATION_OBJECT from '@salesforce/schema/Violation__c';
import ID_FIELD from '@salesforce/schema/Violation__c.Id';
import NAME_FIELD from '@salesforce/schema/Violation__c.Name';
import MARK_FIELD from '@salesforce/schema/Violation__c.Mark__c';
import STATUS_FIELD from '@salesforce/schema/Violation__c.Status__c';
import PROOF_FIELD from '@salesforce/schema/Violation__c.Proof__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Violation__c.Description__c';
import CREATEDBYID_FIELD from '@salesforce/schema/Violation__c.CreatedById';
import CREATIONDATE_FIELD from '@salesforce/schema/Violation__c.Creation_Date__c';
import MARKETING_PARTNER_FIELD from '@salesforce/schema/Violation__c.Marketing_Partner__c';
import ACTIONS_REQUIRED_FIELD from '@salesforce/schema/Violation__c.Actions_required__c';



const FIELDS = [
    'Violation__c.Mark__c',
    'Violation__c.Status__c',
    'Violation__c.Name',
    'Violation__c.Proof__c',
    'Violation__c.Description__c',
    'Violation__c.CreatedById',
    'Violation__c.Creation_Date__c',
    'Violation__c.Marketing_Partner__r.Name',
    'Violation__c.Actions_required__c'
];

export default class NewViolation extends LightningElement {
    @api recordId;
    @api recordTypeId;
    @api isCalledFromAura;
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

    
    @api markCurrent = '';
    @api markPrevious = '';
    @track markOptions;
    @api inputBackground = "slds-input slds-combobox__input"

    @track statusOptions;
    @api statusCurrent;
    @api statusPrevious;

    @track actionsRequiredOptions;
    @api actionsRequiredCurrent;
    @api actionsRequiredPrevious;

    @api descriptionCurrent = '<p></p>';
    @api descriptionPrevious = '<p></p>';

    @api proofCurrent = '<p></p>';
    @api proofPrevious = '<p></p>';

    @api marketingPartnerNameCurrent;
    @api marketingPartnerNamePrevious;
    @api marketingPartnerIdCurrent;
    @api marketingPartnerIdPrevious;
    @track marketingPartnersOptions;

    @api nameValue;
    @api createdByIdValue;
    @api creationDateValue;
    @api createdByNameValue;

    @api actionType = this.recordId ? 'Create violation' : 'Save';
    @api isChanged;
    @api isLoading = false;

    @api logData;
    logColumns = [
        { label: 'Time', fieldName: 'time', type: 'date', typeAttributes:{
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


    connectedCallback() {
        console.log(this.markCurrent)
    }
    get isChanged() {
        return !this.recordId ||
        this.statusCurrent !== this.statusPrevious ||
        this.markCurrent !== this.markPrevious ||
        this.descriptionCurrent !== this.descriptionPrevious ||
        this.proofCurrent !== this.proofPrevious ||
        this.marketingPartnerIdCurrent !== this.marketingPartnerIdPrevious ||
        this.actionsRequiredCurrent !== this.actionsRequiredPrevious
        
    }

    @wire(getObjectInfo, { objectApiName: VIOLATION_OBJECT })
    getDefaultRecordType( {data, error} ){
       if(data){
         this.recordTypeId = data.defaultRecordTypeId;
       }else if(error){
        console.log('Error fetching default record type:');
        console.log(error)
        }
     };


    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredViolation({ data, error }) {
        if (data) {
            console.log(data)
            this.markCurrent = data.fields.Mark__c.value; 
            this.markPrevious = data.fields.Mark__c.value; 
            this.statusCurrent = data.fields.Status__c.value;
            this.statusPrevious = data.fields.Status__c.value;
            this.actionsRequiredCurrent = data.fields.Actions_required__c.value;
            this.actionsRequiredPrevious = data.fields.Actions_required__c.value;
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

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: 'Violation__c.Actions_required__c'})
    getActionsRequiredOptions({ data, error }) {
        if (data) {
            this.actionsRequiredOptions = data.values.map(i => {
                return {
                    label: i.label,
                    value: i.value,
                };
            });

        } else if (error) {
            console.log('Error fetching Actions Required options:');
            console.log(error)
        }
    }

    @wire(selectById, { id: '$createdByIdValue' })
    getName({ data, error }) {
        if (data) {
            this.createdByNameValue = data[0].Name
        } else if (error) {
            console.log('Error while fetching user`s Name by id');
            console.log(error)
        }
    }


    get inputBackground() {
        return this.markCurrent ? 
            `slds-input slds-combobox__input ${/\w+/.exec(this.markCurrent.toLowerCase())[0]}` :
            'slds-input slds-combobox__input'
    }

    changeMark(e) {
        if(!e.target.classList.contains('slds-combobox__input')) {
            this.markCurrent = e.target.getAttribute('title');
        }
        e.currentTarget.classList.toggle('slds-is-open');
    }

    changeStatus(event) {
        this.statusCurrent = event.detail.value;
    }

    changeActionsRequired(event) {
        this.actionsRequiredCurrent = event.detail.value;
    }

    changeDescription(e) {
        this.descriptionCurrent = e.detail.value;
    }

    changeProof(e) {
        this.proofCurrent = e.detail.value;
    }

    upsertViolation() {
        this.isLoading = true;
        const fields = {
            [ID_FIELD.fieldApiName]: this.recordId,
            [MARK_FIELD.fieldApiName]: this.markCurrent,
            [STATUS_FIELD.fieldApiName]: this.statusCurrent,
            [PROOF_FIELD.fieldApiName]: this.proofCurrent,
            [DESCRIPTION_FIELD.fieldApiName]: this.descriptionCurrent,
            [MARKETING_PARTNER_FIELD.fieldApiName]: this.marketingPartnerIdCurrent,
            [ACTIONS_REQUIRED_FIELD.fieldApiName]: this.actionsRequiredCurrent
        };

        if(this.recordId) {
            //update existing record
            fields[ID_FIELD.fieldApiName] = this.recordId;
            const recordInput = { fields };
            updateRecord(recordInput)
                .then( () => {
                    this.isLoading = false;
                    this.statusPrevious = this.statusCurrent;
                    this.markPrevious = this.markCurrent;
                    this.descriptionPrevious = this.descriptionCurrent;
                    this.proofPrevious = this.proofCurrent;
                    this.marketingPartnerIdPrevious = this.marketingPartnerIdCurrent;
                    this.marketingPartnerNamePrevious = this.marketingPartnerNameCurrent;
                    this.actionsRequiredPrevious = this.actionsRequiredCurrent;
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
                    console.log(error)
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
                    console.log(error)
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
        this.actionsRequiredCurrent = this.actionsRequiredPrevious;
        if(this.marketingPartnerIdPrevious) {
            this.isValueSelected = true;
        }
    }

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

    handlePopup() {
        this.isLoading = true;
        getLogs({recordId: this.recordId})
        .then(data => {
            this.logData = data.map(e => {
                const action = /[A-Za-z]+/.exec(e.Field)[0];
                const result = {
                    time: e.CreatedDate,
                    perfomedBy: e.CreatedBy.Name,
                    action: action.charAt(0).toUpperCase() + action.slice(1),
                }
                if(e.OldValue) {
                    result.details = `${e.OldValue} => ${e.NewValue}`
                }
                return result
            })
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
















    @api objName = "Marketing_Partner__c"
    @api filter = '';
    @api searchPlaceholder='Search';

    @track isValueSelected;
    @track blurTimeout;

    searchTerm;
    //css
    @track boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    @track inputClass = '';

    @wire(search, {searchTerm : '$searchTerm', myObject : "Marketing_Partner__c", filter : '$filter'})
    wiredRecords({ error, data }) {
        if (data) {
            this.marketingPartnersOptions = data;
        } else if (error) {
            console.log('Error while fetching marketing partner options');
            console.log(error)
        }
    }


    handleClick() {
        this.searchTerm = '';
        this.inputClass = 'slds-has-focus';
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
    }

    onBlur() {
        this.blurTimeout = setTimeout(() =>  {
            this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus'
        }, 300);
    }

    onSelect(event) {
        this.isValueSelected = true;
        this.marketingPartnerIdCurrent = event.currentTarget.dataset.id;
        this.marketingPartnerNameCurrent = event.currentTarget.dataset.name;
        if(this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    }

    handleRemovePill() {
        this.isValueSelected = false;
        this.marketingPartnerIdCurrent = null;
        this.marketingPartnerNameCurrent = null;
    }

    onSearchChange(event) {
        this.searchTerm = event.target.value;
    }
}