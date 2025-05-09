import React from 'react';
import { Button, Checkbox, Form, Input, DatePicker } from 'antd';
import dayjs from 'dayjs';
const onFinish = values => {
    console.log('Success:', values);
};
const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
};
const init = (list, data) => { }
const Categories = () => {
    const [formVal, setFormVal] = useState({
        date: '2012-12-09',
        password: '123456',
        remember: true
    });
    setFormVal({
        date: dayjs("2021-12-09"),
    })
    console.log(formVal);

    return (
        <Form
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
            initialValues={formVal}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
        >
            <Form.Item
                label="date"
                name="date"
                rules={[{ required: true, message: 'Please input your username!' }]}
            >
                <DatePicker />
            </Form.Item>

            <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
            >
                <Input.Password />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" label={null}>
                <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Form.Item label={null}>
                <Button type="primary" htmlType="submit">
                    Submit
                </Button>
            </Form.Item>
        </Form>
    );
};
export default Categories;