@IsTest public with sharing class UsersSelectorTest {

    @isTest static void selectUserByIdTest() {
        User user = [SELECT Id, Name FROM User WHERE Id =: UserInfo.getUserId()];
        System.assertEquals(user.Name, UsersSelector.selectById(UserInfo.getUserId())[0].Name);
    }
}
