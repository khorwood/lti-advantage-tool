'use strict';

class AGS {
    static get Claims() {
        return {
            Endpoint: 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'
        };
    }

    static get Scopes() {
        return {
            LineItem: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
            LineItemReadOnly: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly',
            Result: 'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
            Score: 'https://purl.imsglobal.org/spec/lti-ags/scope/score'
        };
    }
}

class LTI {
    static get Claims() {
        return {
            Context: 'https://purl.imsglobal.org/spec/lti/claim/context',
            Custom: 'https://purl.imsglobal.org/spec/lti/claim/custom',
            DeploymentId: 'https://purl.imsglobal.org/spec/lti/claim/deployment_id',
            LaunchPresentation: 'https://purl.imsglobal.org/spec/lti/claim/launch_presentation',
            LIS: 'https://purl.imsglobal.org/spec/lti/claim/lis',
            MessageType: 'https://purl.imsglobal.org/spec/lti/claim/message_type',
            ResourceLink: 'https://purl.imsglobal.org/spec/lti/claim/resource_link',
            RoleScopeMentor: 'https://purlimsglobal.org/spec/lti/claim/role_scope_mentor',
            Roles: 'https://purl.imsglobal.org/spec/lti/claim/roles',
            TargetLinkUri: 'https://purl.imsglobal.org/spec/lti/claim/target_link_uri',
            ToolPlatform: 'https://purl.imsglobal.org/spec/lti/claim/tool_platform',
            Version: 'https://purl.imsglobal.org/spec/lti/claim/version'
        };
    }

    static get ContextRoles() {
        return {
            Administrator: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator',
            ContentDeveloper: 'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
            Instructor: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
            Learner: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
            Manager: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Manager',
            Member: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Member',
            Mentor: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor',
            Officer: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Officer'
        };
    }

    static get InstitutionRoles() {
        return {
            Administrator: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator',
            Alumni: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Alumni',
            Faculty: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty',
            Guest: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Guest',
            Instructor: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor',
            Learner: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner',
            Member: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Member',
            Mentor: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Mentor',
            None: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#None',
            Observer: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Observer',
            Other: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Other',
            ProspectiveStudent: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#ProspectiveStudent',
            Staff: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff',
            Student: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student'
        };
    }

    static get SystemRoles() {
        return {
            AccountAdmin: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#AccountAdmin',
            Administrator: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator',
            Creator: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#Creator',
            None: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#None',
            SysAdmin: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#SysAdmin',
            SysSupport: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#SysSupport',
            User: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#User'
        };
    }
}

class NRPS {
    static get Claims() {
        return {
            Endpoint: "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice"
        };
    }
}

class OAuth2 {
    static get AssertionTypes() {
        return {
            JwtBearer: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
        };
    }
    
    static get GrantTypes() {
        return {
            ClientCredentials: 'client_credentials'
        };
    }
}

module.exports = {
    AGS,
    LTI,
    NRPS,
    OAuth2
};
