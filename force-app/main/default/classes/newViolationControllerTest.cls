@IsTest public with sharing class newViolationControllerTest {

    public static final String STATUS_INVESTIGATION = 'Investigation Complete';
    public static final String STATUS_RESOLVED = 'Resolved';
    public static final String STATUS_SENT = 'Alert Sent';
    public static final String MARK_ORANGE = 'Orange';

    @testSetup
	private static void setupData() {
        
        Marketing_Partner__c newMarketingPartner = TestDataFactory.createMarketingPartner('Test MarketingPartner', 'test@test.com');
		insert newMarketingPartner;
        
        Violation__c newViolation = TestDataFactory.createViolation(newMarketingPartner.id, STATUS_INVESTIGATION, MARK_ORANGE);
        
        Violation__c newViolation1 = TestDataFactory.createViolation(newMarketingPartner.id, STATUS_RESOLVED, MARK_ORANGE);
        insert new List<Violation__c> {newViolation, newViolation1};
            
        Contact c = TestDataFactory.createContact('test');
        insert c;
        
    } 

    @isTest static void newViolationControllerTest() {
        Violation__c violation = [SELECT Id, Status__c, Mark__c, Marketing_Partner__c FROM Violation__c LIMIT 1];
        newViolationController.sendEmailAlert(violation.Id);

        Test.startTest();
        violation.Status__c = STATUS_RESOLVED;
        update violation;
        Test.stopTest();
        List<Violation__History> logs = newViolationController.getLogs(violation.Id);
    }
}

