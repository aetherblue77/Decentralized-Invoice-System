// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error InvoiceSystem__InvalidAmount();
error InvoiceSystem__InvalidTokenAddress();
error InvoiceSystem__InvoiceNotFound();
error InvoiceSystem__InvoiceAlreadyPaid();
error InvoiceSystem__PaymentTransferFailed();

contract InvoiceSystem is ReentrancyGuard {
    // --- DATABASE (State Variables) ---
    uint256 public invoiceId;

    struct Invoice {
        uint256 id;
        address seller; // Creator of Invoice
        address client;
        address tokenAddress;
        uint256 amount;
        string description;
        bool isPaid;
    }

    mapping(uint256 => Invoice) public invoices;

    event InvoiceCreated(
        uint256 indexed id,
        address indexed seller,
        uint256 amount,
        string description
    );
    event InvoicePaid(uint256 indexed id, address indexed client);

    // --- MAIN FUNCTIONS ---
    function createInvoice(
        address _tokenAddress,
        uint256 _amount,
        string memory _description
    ) external {
        if (_amount == 0) {
            revert InvoiceSystem__InvalidAmount();
        }

        if (_tokenAddress == address(0)) {
            revert InvoiceSystem__InvalidTokenAddress();
        }

        // Start from 1 for Id
        invoiceId++;
        invoices[invoiceId] = Invoice({
            id: invoiceId,
            seller: msg.sender,
            client: address(0),
            tokenAddress: _tokenAddress,
            amount: _amount,
            description: _description,
            isPaid: false
        });

        emit InvoiceCreated(invoiceId, msg.sender, _amount, _description);
    }

    function payInvoice(uint256 _invoiceId) external nonReentrant {
        Invoice storage invoice = invoices[_invoiceId];

        if (invoice.seller == address(0)) {
            revert InvoiceSystem__InvoiceNotFound();
        }

        if (invoice.isPaid) {
            revert InvoiceSystem__InvoiceAlreadyPaid();
        }

        invoice.isPaid = true;
        invoice.client = msg.sender;
        // transferFrom include check balance of client
        bool success = IERC20(invoice.tokenAddress).transferFrom(
            msg.sender,
            invoice.seller,
            invoice.amount
        );

        if (!success) {
            revert InvoiceSystem__PaymentTransferFailed();
        }
        emit InvoicePaid(_invoiceId, msg.sender);
    }
}
