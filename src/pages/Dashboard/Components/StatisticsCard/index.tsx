import React, { FC } from 'react';
import { Card, Row, Col } from 'antd';

interface Props {
    title?: string; // 标题
    children: React.ReactNode; // 内容
}

const StatisticsCard: FC<Props> = (props) => {
    const { title, children } = props;

    return (
        <Card>
            {children}
        </Card>
    );
};

export default StatisticsCard; 