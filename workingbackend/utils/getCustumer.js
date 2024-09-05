import axios from 'axios';
import stringSimilarity from 'string-similarity';

const customerName = "ill's";

async function findCustomerIdByName(accessToken, realmId) {
  try {
    // Fetch all customers from QuickBooks Online
    let customers = [];
    let startPosition = 1;
    let fetchMore = true;

    while (fetchMore) {
      const query = `SELECT Id, DisplayName FROM Customer STARTPOSITION ${startPosition}`;
      const encodedQuery = encodeURIComponent(query);

      const response = await axios.get(
        `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodedQuery}&minorversion=73`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'text/plain',
          },
        }
      );

      const fetchedCustomers = response.data.QueryResponse.Customer || [];
      customers = customers.concat(fetchedCustomers);

      // Check if there are more customers to fetch
      if (response.data.QueryResponse.maxResults && fetchedCustomers.length === response.data.QueryResponse.maxResults) {
        startPosition += fetchedCustomers.length;
      } else {
        fetchMore = false;
      }
    }

    // Function to find the closest match
    const findBestMatch = (customers, name) => {
      let bestMatch = null;
      let highestScore = 0;

      customers.forEach(customer => {
        const score = stringSimilarity.compareTwoStrings(customer.DisplayName, name);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = customer;
        }
      });

      return bestMatch;
    };

    // Find the customer with the closest name match
    const bestMatchCustomer = findBestMatch(customers, customerName);

    // Return the ID of the best match customer, or null if none found
    return bestMatchCustomer ? bestMatchCustomer.Id : null;

  } catch (error) {
    console.error('Error fetching customers:', error.response?.data || error.message);
    return null;
  }
}

export {
  findCustomerIdByName
};
