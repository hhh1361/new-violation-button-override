({
	closeQA : function(component, event, helper) {
        if(component.get('v.recordId')) {
            var navigateEvent = $A.get("e.force:navigateToSObject");
            navigateEvent.setParams({ "recordId": component.get('v.recordId') });
            navigateEvent.fire();
        } else {
            var homeEvent = $A.get("e.force:navigateToObjectHome");
            homeEvent.setParams({
                "scope": "Violation__c"
            });
            homeEvent.fire();
        }
    }
})
