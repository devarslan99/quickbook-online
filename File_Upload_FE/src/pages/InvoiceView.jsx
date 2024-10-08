import {
  Box,
  IconButton,
  Typography,
  Modal,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { IoEye } from "react-icons/io5";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { GiCancel } from "react-icons/gi";

const InvoiceView = () => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleOpen = (id) => {
    setOpen(!open);
    setSelectedId(id);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://192.168.100.238:3000/getInvoices");
        console.log(response.data);
        setInvoiceData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      field: "date",
      headerName: "Date of Upload",
      type: "number",
      headerAlign: "left",
      align: "left",
      width: 170,
    },
    {
      field: "invoiceDate",
      headerName: "Invoice Date",
      type: "number",
      headerAlign: "left",
      align: "left",
      width: 150,
    },
    {
      field: "name",
      headerName: "Customer Name",
      width: 250,
    },
    // {
    //   field: "Auction",
    //   headerName: "Auction Name",
    //   width: 150,
    // },
    {
      field: "listItems",
      headerName: "Number of Cars",
      headerAlign: "center",
      align: "center",
      width: 150,
      renderCell: ({ row }) => {
        const { listItems } = row;
        return (
          <Box margin="0 auto" display="flex" justifyContent="center" alignItems={"center"}>
            {listItems.length}
          </Box>
        );
      },
    },
    {
      headerName: "Details",
      headerAlign: "center",
      align: "center",
      width: 150,
      renderCell: ({ row }) => {
        const { id } = row;
        return (
          <Box margin="0 auto" display="flex" justifyContent="center" alignItems={"center"}>
            <IconButton onClick={() => handleOpen(id)}>
              <IoEye />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box className="flex justify-center items-center h-screen bg-backImg bg-cover bg-center">
      <Box
        p={2}
        border={1}
        maxWidth={"90%"}
        borderColor="#F0F0F0"
        borderRadius={3}
        sx={{
          bgcolor: "white",
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: "bold",
            fontSize: "16px",
          },
        }}
      >
        <DataGrid
          rows={invoiceData.map((data) => ({ ...data, id: data.id || data.no }))}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 6,
              },
            },
          }}
          pageSizeOptions={[10]}
        />
        <Modal
          open={open}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box className="absolute top-2/4 md:w-3/4 w-4/5 left-2/4 h-3/4 overflow-y-auto transform -translate-x-2/4 -translate-y-2/4 bg-white p-4 rounded-md">
            <Box className="flex justify-between items-center mb-3 ">
              <Typography variant="" className="md:text-3xl text-2xl font-bold  ">
                Invoice Items
              </Typography>
              <IconButton onClick={handleOpen} className="mr-3">
                <GiCancel size={22} />
              </IconButton>
            </Box>
          <Box className="flex lg:flex-row flex-col  gap-3 ">
          <Typography id="modal-modal-description" >
          {invoiceData
      .filter((item) => item.id === selectedId)
      .map((item) => (
        <>
        <Typography key={item.id} variant="" className="text-base mt-4">
          Auction Name: {item.Auction}
        </Typography>
        <br/>
        <Typography key={item.id} variant="" className="text-base" >
          Dealer Name: {item.name}
        </Typography>
        <br/>
        <Typography key={item.id} variant="" className="text-base" >
          Auction Date: {item.invoiceDate}
        </Typography>
        </>
      ))}
              <Table >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Sr. No.</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Model</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Make</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Color</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>VIN No</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceData
                    .filter((leader) => leader.id === selectedId)
                    .map((leader) =>
                      leader.listItems.map((listItem, index) => (
                        <TableRow key={listItem.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{listItem.year}</TableCell>
                          <TableCell>{listItem.model}</TableCell>
                          <TableCell>{listItem.make}</TableCell>
                          <TableCell>{listItem.color}</TableCell>
                          <TableCell>{listItem.winNo}</TableCell>
                        </TableRow>
                      ))
                    )}
                </TableBody>
              </Table>
            </Typography>
            <Box className="w-full mt-8">
            
            {invoiceData
  .filter((item) => item.id === selectedId)
  .map((item) => (
    item.imgUrl.endsWith('.pdf') ? (
      <object
        data={item.imgUrl}
        type="application/pdf"
        width="100%"
        height="500px"
        key={item.id}
      >
        <p>It appears you don't have a PDF plugin for this browser. You can <a href={item.imgUrl}>click here to download the PDF file.</a></p>
      </object>
    ) : (
      <img
        src={item.imgUrl}
        alt="Image"
        className="object-cover"
        key={item.id}
      />
    )
  ))}
            </Box>
          </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default InvoiceView;
  