// API Configuration
const CONFIG = {
    SIGNIN_URL: 'https://01.gritlab.ax/api/auth/signin',
    DOMAIN: '01.gritlab.ax',
    GRAPHQL_ENDPOINT: 'https://01.gritlab.ax/api/graphql-engine/v1/graphql'
};

// GraphQL Queries
const QUERIES = {
    USER_INFO: `
    {
        user {
            id
            login
            attrs
            campus
            labels {
                labelId
                labelName
            }
            createdAt
            updatedAt
            auditRatio
            totalUp
            totalUpBonus
            totalDown
        }
        
        wip: progress (
            where: {isDone: {_eq: false}, grade : {_is_null: true}}
            order_by: [{createdAt: asc}]
        ){
            id
            eventId
            createdAt
            updatedAt
            path
            group{
                members{
                    userLogin
                }
            }
        }
    }`,

    USER_PROJECT: (eventId) => `
    {
      completed: result (
          order_by: [{createdAt: desc}]
          where: { isLast: { _eq: true}, type : {_nin: ["tester", "admin_audit", "dedicated_auditors_for_event"]}}
      ) {
          objectId
          path
          createdAt
          group{
              members{
                  userLogin
              }
          }
      }

      

      
    }`,

    USER_SKILLS: `{
      skills: transaction(
          order_by: [{ type: desc }, { amount: desc }]
          distinct_on: [type]
          where: { type: { _like: "skill_%" } }
      ) {
          objectId
          eventId
          type
          amount
          createdAt
      }
    }`
};

export { CONFIG, QUERIES };