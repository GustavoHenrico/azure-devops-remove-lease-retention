const axios = require('axios');
const Buffer = require('buffer').Buffer;

const organization = "";
const project = "";
const personalAccessToken = "";
const definitionId = "";


const baseURL = `https://dev.azure.com/${organization}/${project}/_apis/build`;

const getAuthHeaders = (token) => {
    const buff = Buffer.from(':' + token);
    const base64token = buff.toString('base64');
    return {
        'Authorization': 'Basic ' + base64token,
        'Content-Type': 'application/json'
    };
};

const Main = async () => {
    try {
        const builds = await axios.get(`${baseURL}/builds?definitions=${definitionId}&api-version=7.0`, {
            headers: getAuthHeaders(personalAccessToken)
        });

        const leasesRequests = builds.data.value.map(async (build) => {
            const leases = await axios.get(`${baseURL}/retention/leases?definitionId=${definitionId}&runId=${build.id}`, {
                headers: getAuthHeaders(personalAccessToken)
            });

            const deleteRequests = leases.data.value.map((lease) =>
                axios.delete(`${baseURL}/retention/leases?ids=${lease.leaseId}`, {
                    headers: {
                        ...getAuthHeaders(personalAccessToken),
                        'Accept': 'application/json;api-version=6.0-preview.2'
                    }
                })
            );

            return Promise.all(deleteRequests);
        });

        await Promise.all(leasesRequests);
        console.log("All retention leases deleted");
    } catch (error) {
        console.error("An error occurred:", error);
    }
};

Main();
