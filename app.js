const axios = require("axios");
const epiHost = process.env.EPIQUERY_SERVER || "localhost";
const epiPath =
    "/referrals/select-partner-referrals-to-notify-recruiting-team.sql";


//partner distro list per country
const partnershipDistro = {
    899: 'GLGPartnershipCN@glgroup.com',  //China
    953: 'GLGPartnershipID@glgroup.com',  //HK
    957: 'GLGPartnershipID@glgroup.com',  //Indonesia
    962: 'GLGPartnershipJP@glgroup.com',  //Japan
    867: 'GLGPartnershipAU@glgroup.com', // Australia
    152: 'GLGPartnershipAU@glgroup.com', // New Zealand
    1087: 'GLGPartnershipVN@glgroup.com', // Viet Nam
    1052: 'GLGPartnershipKR@glgroup.com', // South Korea
    14415: 'GLGPartnershipKR@glgroup.com', // North Korea
    'fallback': 'GLGPartnershipID@glgroup.com',
}

const mailinator = require("mailinator")({
    templateFolder: ".",
    type: "recruiting-partner-app-notification"
});

const sendEmail = (projectTeamMember, leadData) => {
    const sponsorEmail = leadData.sponsorEmail
        ? `${leadData.sponsorName} <${leadData.sponsorEmail}>`
        : "Referral System <noReply@glgroup.com>";

    //remove BETA_USERS after beta test is completed
    process.env.BETA_USERS.toLowerCase().includes(projectTeamMember.email.toLowerCase())
        && mailinator
            .send({
                to: `${projectTeamMember.email}`,
                cc: `${projectTeamMember.ccEmail}`,
                bcc: 'GLGPartnershipCN@glgroup.com,majibola@glgroup.com',
                from: sponsorEmail,
                subject: `${leadData.name} referred ${leadData.projectTitle ? `to ${leadData.projectTitle}` : ' as VIP'}`,
                template: "email",
                context: { lead: leadData },
                properties: {
                    cm_id: leadData.councilMemberId
                }
            })
            .then(res => {
                //console.log(res);
            });
};

const sendParsedRefferalRecord = async () => {
    try {
        const data = (await axios.get(`${epiHost}${epiPath}`)).data;
        if (data && Array.isArray(data)) {
            data.map(leadData => {
                const teamInfo = leadData.team;
                JSON.parse(teamInfo).map(recipiantInfo => {
                    const { email, name } = recipiantInfo;
                    const ccEmail = leadData.country
                        && partnershipDistro[leadData.country]
                        ? partnershipDistro[leadData.country]
                        : partnershipDistro['fallback']
                    const projectTeamMember = {
                        ccEmail,
                        email,
                        name,
                        projectTitle: leadData.title
                    };
                    sendEmail(projectTeamMember, leadData);
                });
            });
        }
    } catch (e) {
        console.log(e);
    }
};

sendParsedRefferalRecord();
