import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, Form, message } from "antd";
import { ColumnsType } from "antd/es/table";
import { DeleteOutlined } from "@ant-design/icons";
import { Group } from "./models/group"; // Import Group interface
import { apiClient } from "./utils/api";
import { Link } from "react-router-dom";
import { checkAuthAndHandleLogout } from "./authcheck";

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form] = Form.useForm();

  // 🔄 Fetch Groups on Load
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const stillLoggedIn = await checkAuthAndHandleLogout();
  if (!stillLoggedIn) return;
      const response = await apiClient.get<{ success: boolean; data: Group[] }>("/group");
      setGroups(response.data.data);
    } catch (error) {
              console.error(error)

      message.error("Failed to fetch groups");
    }
    setLoading(false);
  };

  // 🆕 Open Modal for Adding New Group
  const handleAddGroup = () => {
    setEditingGroup(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // ✏️ Open Modal for Editing Group
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    form.setFieldsValue(group);
    setIsModalOpen(true);
  };
  const handleDeleteGroup = async (groupId: number) => {
    try {
      await apiClient.delete(`/delete-group/${groupId}`);
      message.success("Group deleted successfully!");
      fetchGroups();
    } catch (error) {
      console.error(error);
      message.error("Failed to delete group");
    }
  };
  // ✅ Submit Form (Insert/Update)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingGroup) {
        // Update Existing Group
        await apiClient.put(`/groups/${editingGroup.id}`, values);
        message.success("Group updated successfully!");
      } else {
        // Add New Group
        const response = await apiClient.post<{ success: boolean; data: Group[] }>("/groups", values);
        if (response.data.data[0]?.groupname === values.groupname) {
          message.error("Group name already exists!");
        } else {
          message.success("Group added successfully!");
        }
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (error) {
              console.error(error)

      message.error("Something went wrong/Group name already exists!");
    }
  };

  // 🔍 Filter Groups
  const filteredGroups = groups.filter((group) =>
    group.groupname.toLowerCase().includes(search.toLowerCase())
  );

  // 📊 Table Columns
  const columns: ColumnsType<Group> = [
    { title: "Group Name", dataIndex: "groupname", key: "groupname" },
    { title: "Commission", dataIndex: "commission", key: "commission" },
    { title: "Non-Pana Payable", dataIndex: "nonpana_payable", key: "nonpana_payable" },
    { title: "Pana Payable", dataIndex: "pana_payable", key: "pana_payable" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button onClick={() => handleEditGroup(record)}>Edit</Button>
          <Button
            onClick={() =>
              Modal.confirm({
                title: 'Are you sure you want to delete this group?',
                content: 'This action cannot be undone.',
                onOk: () => handleDeleteGroup(record.id),
              })
            }
            icon={<DeleteOutlined />}
            danger
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <div className="header">
            <Link to="/users">Users</Link>
            <Link to="/games" >
              Games
            </Link>
            <Link className="active" to="/groups">Groups</Link>
             <Link to="/result/:gameid/:gamename" >
              Settlement
            </Link>
          </div>
      <h2>Groups</h2>
      <Input.Search
        placeholder="Search by group name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      />
      <Button type="primary" onClick={handleAddGroup} style={{ marginBottom: 16 }}>
        Add Group
      </Button>
      <Table
        columns={columns}
        dataSource={filteredGroups}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
<Modal
  title={editingGroup ? "Edit Group" : "Add Group"}
  open={isModalOpen}
  onOk={handleSubmit}
  onCancel={() => setIsModalOpen(false)}
>
  <Form form={form} layout="vertical">
    <Form.Item 
      name="groupname" 
      label="Group Name" 
      rules={[{ required: true }]}
    >
      <Input />
    </Form.Item>
    
    <Form.Item
      name="commission"
      label="Commission"
      rules={[
        { required: true, message: "Commission is required" },
        { 
          validator: (_, value) => 
            value >= 100 
              ? Promise.reject("Commission cannot be 100 or more") 
              : Promise.resolve()
        }
      ]}
    >
      <Input 
        type="number" 
        onChange={(e) => {
          const commissionValue = Number(e.target.value);
          if (commissionValue < 100) {
            form.setFieldsValue({ nonpana_payable: 100 - commissionValue });
          }
        }}
      />
    </Form.Item>

    <Form.Item name="nonpana_payable" label="Non-Pana Payable">
      <Input type="number" readOnly />
    </Form.Item>

    <Form.Item name="pana_payable" label="Pana Payable">
      <Input type="number" />
    </Form.Item>
  </Form>
</Modal>

    </div>
  );
};

export default Groups;
