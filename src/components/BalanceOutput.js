import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];

  /* YOUR CODE GOES HERE */

  // combine accounts and journal data
  let combinedArray = state.journalEntries.map((e) => {
      for(let element of state.accounts) {
          if(e.ACCOUNT == element.ACCOUNT) Object.assign(e, element);
      }
      return e;
  }).sort((a, b) => a.ACCOUNT - b.ACCOUNT);

  // handle * user inputs
  if (state.userInput.startPeriod == "Invalid Date") state.userInput.startPeriod = combinedArray[0].PERIOD;
  if (state.userInput.endPeriod == "Invalid Date") state.userInput.endPeriod = combinedArray[combinedArray.length - 1].PERIOD
  if (Number.isNaN(state.userInput.endAccount)) state.userInput.endAccount = combinedArray[combinedArray.length - 1].ACCOUNT;
  if (Number.isNaN(state.userInput.startAccount)) state.userInput.startAccount = combinedArray[0].ACCOUNT;

  // return accounts based on user inputs
  let filteredArray = combinedArray.filter(entry =>
          entry.ACCOUNT >= state.userInput.startAccount 
          && entry.ACCOUNT <= state.userInput.endAccount 
          && entry.PERIOD.getTime() >= Date.parse(state.userInput.startPeriod)
          && entry.PERIOD.getTime() <= Date.parse(state.userInput.endPeriod)
  );

  Object.values(filteredArray.reduce((acc, { ACCOUNT, CREDIT, DEBIT, LABEL}) => {
    acc[ACCOUNT] = acc[ACCOUNT] || { ACCOUNT, DEBIT: 0, CREDIT: 0, BALANCE: 0 };
    acc[ACCOUNT].CREDIT += CREDIT;
    acc[ACCOUNT].DEBIT += DEBIT;
    acc[ACCOUNT].BALANCE = acc[ACCOUNT].DEBIT- acc[ACCOUNT].CREDIT;
    acc[ACCOUNT].DESCRIPTION = LABEL;
    return acc;
  }, {})).forEach(entry =>
      balance.push(entry)  
  )

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
